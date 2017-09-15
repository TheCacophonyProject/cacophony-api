var config = require('../../config/config');
var log = require('../../logging');
var requestUtil = require('./requestUtil');
var responseUtil = require('./responseUtil');

var INVALID_DATA = 'Invalid data key in body, should be a JSON.';
var INVALID_ID = 'Invalid ID field. Shoudl be an integer.';
var NO_DATAPOINT_FOUND =
  'No datapoint was found with given ID. make sure that you have permissions ' +
  'to view datapoint.';
var NO_FILE_FOUND = 'No file found with given datapoint.';

function getRecordingsFromModel(modelClass, request, response) {

  // Check that if the request was authenticated that is was
  // authenticated by a user JWT, not a device JWT.
  // TODO get passport to do this...
  if (request.user !== null && !requestUtil.isFromAUser(request))
    return responseUtil.notFromAUser(response);

  var query = requestUtil.getSequelizeQueryFromHeaders(request);
  if (query.badRequest)
    return responseUtil.invalidDatapointGet(response, query.badRequest);

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
        result.rows.push(modelInstances.rows[key].getFrontendFields());

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

  // Check that if the request was authenticated that is was
  // authenticated by a user JWT, not a device JWT.
  // TODO get passport to do this...
  if (request.user !== null && !requestUtil.isFromADevice(request))
    return responseUtil.notFromADevice(response);

  var device = request.user;
  var modelClass = model;
  var modelInstance;
  var file;

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
      if (typeof device.public == 'boolean')
        modelInstance.set('public', device.public);
      else
        model.setDataValue('public', false);
      return modelInstance.validate();
    })
    .then(() => modelInstance.save())
    .then(() => responseUtil.validDatapointUpload(response))
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
    return responseUtil.notFromAUser(response);

  var id = parseInt(request.params.id);
  if (!id)
    return responseUtil.invalidDataId(response);

  modelClass
    .getFileData(id, request.user)
    .then((fileData) => {
      if (fileData === null) {
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
    return responseUtil.notFromAUser(response);

  var data = parseJsonFromString(request.body.data);
  if (data === null)
    return responseUtil.invalidDatapointUpdate(response, INVALID_DATA);

  var id = parseInt(request.params.id);
  if (!id)
    return responseUtil.invalidDatapointUpdate(response, INVALID_ID);

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
    return responseUtil.notFromAUser(response);

  var id = parseInt(request.params.id);
  if (!id)
    return responseUtil.invalidDataId(response);

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

exports.getRecordingsFromModel = getRecordingsFromModel;
exports.addRecordingFromPost = addRecordingFromPost;
exports.updateDataFromPut = updateDataFromPut;
exports.getRecordingFile = getRecordingFile;
exports.deleteDataPoint = deleteDataPoint;
exports.parseJsonFromString = parseJsonFromString;
exports.handleResponse = responseUtil.send;
exports.catchError = catchError;
