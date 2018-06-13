var log = require('../../logging');
var requestUtil = require('./requestUtil');
var responseUtil = require('./responseUtil');
const uuidv4            = require('uuid/v4');
const multiparty        = require('multiparty');
const config            = require('../../config');
const modelsUtil        = require('../../models/util/util');

var INVALID_DATA = 'Invalid data key in body, should be a JSON.';
var INVALID_ID = 'Invalid ID field. Should be an integer.';
var NO_DATAPOINT_FOUND =
  'No datapoint was found with given ID. make sure that you have permissions ' +
  'to view datapoint.';
var NO_FILE_FOUND = 'No file found with given datapoint.';

function getRecordingsFromModel(modelClass, request, response) {

  // Check that if the request was authenticated that is was
  // authenticated by a user JWT, not a device JWT.
  // TODO get passport to do this...
  if (request.user !== null && !requestUtil.isFromAUser(request))
  {return responseUtil.notFromAUser(response);}

  var query = requestUtil.getSequelizeQueryFromHeaders(request);
  if (query.badRequest)
  {return responseUtil.invalidDatapointGet(response, query.badRequest);}

  modelClass
    .findAllWithUser(request.user, query)
    .then((modelInstances) => {
      var result = {
        rows: [],
        limit: modelInstances.limit,
        offset: modelInstances.offset,
        count: modelInstances.count,
      };
      // Just save the front end fields for each model.
      for (var key in modelInstances.rows)
      {result.rows.push(modelInstances.rows[key].getFrontendFields());}

      return responseUtil.validDatapointGet(response, result);
    })
    .catch((error) => catchError(error, response));
}

/**
 * Processes the POST request checking that the request is valid then saving the
 *  metadata in a sequelize model and uploading the file to the file storage.
 * @param {Object} modelClass - Sequelize Model of the type of the recording.
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 */
function addRecordingFromPost(model, request, response) {
  var device = request.device;
  var modelClass = model;
  var modelInstance;
  var file;

  if (request.device === null) {
    throw { badRequest: "expected device" };
  }

  requestUtil
    .getFileAndDataField(request)
    .then(([data, f]) => {
      file = f;
      // Build model. But limit what fields can be set.
      modelInstance = modelClass.build(data, {
        fields: modelClass.apiSettableFields
      });

      modelInstance.set('DeviceId', device.id);
      modelInstance.set('GroupId', device.GroupId);
      if (typeof device.public == 'boolean') {
        modelInstance.set('public', device.public);
      } else {
        model.setDataValue('public', false);
      }
      return modelInstance.validate();
    })
    .then(() => modelInstance.save())
    .then(() => responseUtil.validRecordingUpload(response, modelInstance.id))
    .then(() => modelInstance.processRecording(file))
    .then((processedFile) => modelInstance.saveFile(processedFile))
    .catch((error) => {
      catchError(error, response, responseUtil.invalidDatapointUpload);
    });
}

function getRecordingFile(modelClass, request, response) {
  // Check that if the request was authenticated that is was
  // authenticated by a user JWT, not a device JWT.
  // TODO get passport to do this...
  if (request.user !== null && !requestUtil.isFromAUser(request)) {
    responseUtil.notFromAUser(response);
    return;
  }

  var id = parseInt(request.params.id);
  if (!id) {
    responseUtil.invalidDataId(response);
    return;
  }

  modelClass
    .getFileData(id, request.user)
    .then((fileData) => {
      if (fileData === null || fileData.key === null) {
        throw { badRequest: NO_FILE_FOUND };
      }
      responseUtil.validFileRequest(response, {
        _type: 'fileDownload',
        key: fileData.key,
        filename: fileData.name,
        mimeType: fileData.mimeType,
      });
    })
    .catch((error) => {
      catchError(error, response, responseUtil.invalidDatapointGet);
    });
}

function updateDataFromPut(modelClass, request, response) {

  if (!requestUtil.isFromAUser(request)) {
    return responseUtil.notFromAUser(response);
  }

  var data = parseJsonFromString(request.body.data);
  if (data === null) {
    return responseUtil.invalidDatapointUpdate(response, INVALID_DATA);
  }

  var id = parseInt(request.params.id);
  if (!id) {
    return responseUtil.invalidDatapointUpdate(response, INVALID_ID);
  }

  modelClass
    .findAllWithUser(request.user, { where: { id: id } })
    .then((modelInstances) => {
      var modelInstance = modelInstances.rows[0];
      if (modelInstance === null || modelInstance === undefined) {
        responseUtil.invalidDatapointUpdate(response, NO_DATAPOINT_FOUND);
        throw { badRequest: NO_DATAPOINT_FOUND };
      }
      return modelInstance.update(data, {
        fields: modelClass.apiUpdateableFields
      });
    })
    .then(() => responseUtil.validDatapointUpdate(response))
    .catch((error) => {
      catchError(error, response, responseUtil.invalidDatapointUpdate);
    });
}

function deleteDataPoint(modelClass, request, response) {
  if (!requestUtil.isFromAUser(request))
  {return responseUtil.notFromAUser(response);}

  var id = parseInt(request.params.id);
  if (!id)
  {return responseUtil.invalidDataId(response);}

  modelClass
    .deleteModelInstance(id, request.user)
    .then(() => responseUtil.validDatapointDelete(response))
    .catch(err => {
      catchError(err, response, responseUtil.invalidDatapointDelete);
    });
}

// Returns a JSON of the string, if parsing to a JSON failes null is returned.
function parseJsonFromString(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    log.debug("Could not parse string to JSON: ", jsonString);
    return null;
  }
}

function catchError(error, response, responseFunction) {
  if (error.badRequest) {
    responseFunction(response, error.badRequest);
    return log.info('Bad request: ', error.badRequest);
  }
  if (error.name === 'SequelizeValidationError') {
    responseFunction(response, error.message);
    return log.info('Bad request: ', error.message);
  }
  return responseUtil.serverError(response, error);
}

function multipartDownload(recordTypeName, buildRecord){
  return (request, response) => {
    var key = uuidv4();
    var data;
    var upload;

    // Note regarding multiparty: there are no guarantees about the
    // order that the field and part handlers will be called. You need
    // to formulate the response to the client in the close handler.
    var form = new multiparty.Form();

    // Handle the "data" field.
    form.on('field', (name, value) => {
      if (name != 'data') {
        return;
      }

      try {
        data = JSON.parse(value);
      } catch (err) {
        // This leaves `data` unset so that the close handler (below)
        // will fail the upload.
        log.error("invalid 'data' field:", err);
      }
    });

    // Handle the "file" part.
    form.on('part', (part) => {
      if (part.name != 'file') {
        part.resume();
        return;
      }

      upload = modelsUtil.openS3().upload({
        Bucket: config.s3.bucket,
        Key: key,
        Body: part,
      }).promise()
        .catch((err) => {
          return err;
        });
      log.debug('started streaming upload to bucket...');
    });

    // Handle any errors. If this is called, the close handler
    // shouldn't be.
    form.on('error', (err) => {
      responseUtil.serverError(response, err);
    });

    // This gets called once all fields and parts have been read.
    form.on('close', async () => {
      if (!data) {
        log.error("upload missing 'data' field");
        responseUtil.invalidDatapointUpload(response);
        return;
      }
      if (!upload) {
        log.error("upload was never started");
        responseUtil.invalidDatapointUpload(response);
        return;
      }

      var dbRecord;
      try {
        // Wait for the upload to complete.
        var uploadResult = await upload;
        if (uploadResult instanceof Error) {
          responseUtil.serverError(response, uploadResult);
          return;
        }
        log.info("finished streaming upload to object store. key:", key);

        // Store a record for the upload.
        dbRecord = buildRecord(request, data, key);
        await dbRecord.validate();
        await dbRecord.save();
      } catch (err) {
        responseUtil.serverError(response, err);
        return;
      }
      responseUtil.validRecordingUpload(response, dbRecord.id);
    });

    form.parse(request);
  };
}

exports.getRecordingsFromModel = getRecordingsFromModel;
exports.addRecordingFromPost = addRecordingFromPost;
exports.updateDataFromPut = updateDataFromPut;
exports.getRecordingFile = getRecordingFile;
exports.deleteDataPoint = deleteDataPoint;
exports.parseJsonFromString = parseJsonFromString;
exports.handleResponse = responseUtil.send;
exports.catchError = catchError;
exports.multipartDownload = multipartDownload;
