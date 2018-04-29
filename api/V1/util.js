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
  if (request.user !== null && !requestUtil.isFromAUser(request))
  {return responseUtil.notFromAUser(response);}

  var id = parseInt(request.params.id);
  if (!id)
  {return responseUtil.invalidDataId(response);}

  modelClass
    .getFileData(id, request.user)
    .then((fileData) => {
      if (fileData === null || fileData.key === null) {
        responseUtil.invalidFileRequest(response, NO_FILE_FOUND);
        throw { badRequest: NO_FILE_FOUND };
      }
      return responseUtil.validFileRequest(response, {
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

  if (!requestUtil.isFromAUser(request))
  {return responseUtil.notFromAUser(response);}

  var data = parseJsonFromString(request.body.data);
  if (data === null)
  {return responseUtil.invalidDatapointUpdate(response, INVALID_DATA);}

  var id = parseInt(request.params.id);
  if (!id)
  {return responseUtil.invalidDatapointUpdate(response, INVALID_ID);}

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
  return async (request, response) => {

    var dbRecord;
    var key = uuidv4();
    var validData = false;
    var uploadStarted = false;

    var form = new multiparty.Form();
    // Make new record from the data part.
    // TODO Stop stream if 'data' is invalid.
    form.on('field', (name, value) => {
      if (name != 'data') {
        return; // Only parse data field.
      }
      try {
        var data = JSON.parse(value);
        dbRecord = buildRecord(request, data, key);
        validData = true;
      } catch (e) {
        log.debug(e);
        // TODO Stop stream here.
      }
    });

    // Stream file to S3.
    var uploadPromise;
    form.on('part', (part) => {
      if (part.name != 'file') {
        return part.resume();
      }
      uploadStarted = true;
      log.debug('Streaming file to bucket.');
      uploadPromise = new Promise(function(resolve, reject) {
        var s3 = modelsUtil.openS3();
        s3.upload({
          Bucket: config.s3.bucket,
          Key: key,
          Body: part,
        }, (err) => {
          if (err) {
            return reject(err);
          }
          log.info("Finished streaming file to object store key:", key);
          resolve();
        });
      });
    });

    // Close response.
    form.on('close', async () => {
      log.info("Finished POST request.");
      if (!validData || !uploadStarted) {
        return responseUtil.invalidDatapointUpload(response);
      }

      // Check that the file uploaded to file store.
      try {
        await uploadPromise;
      } catch (e) {
        return responseUtil.send(response, {
          statusCode: 500,
          success: false,
          messages: ["Failed to upload file to bucket"],
        });
      }
      // Validate and upload recording
      await dbRecord.validate();
      await dbRecord.save();
      return responseUtil.validRecordingUpload(response, dbRecord.id);
    });

    form.on('error', (e) => {
      log.error(e);
      return responseUtil.send(response, {
        statusCode: 400,
        success: false,
        messages: ["failed to get file content"],
      });
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
