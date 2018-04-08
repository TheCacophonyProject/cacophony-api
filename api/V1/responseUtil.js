var log = require('../../logging');
var jwt = require('jsonwebtoken');
var config = require('../../config');

const VALID_DATAPOINT_UPLOAD_REQUEST =
  'Thanks for the data.';
const VALID_DATAPOINT_DELETE_REQUEST =
  'Datapoint deleted.';
const VALID_DATAPOINT_UPDATE_REQUEST =
  'Datapoint was updated.';
const VALID_DATAPOINT_GET_REQUEST =
  'Successful datapoint get request.';
const VALID_FILE_REQUEST =
  'Successful file request.';
const VALID_ADD_TAGS_REQUEST =
  'Tags were added successfuly.';
const VALID_DELETE_TAGS_REQUEST =
  'Tags were deleted successfuly.';
const VALID_GET_TAGS_REQUEST =
  'Successful GET tags request.';
const VALID_GET_MODEL =
  'Successful get datapoint.';

const INVALID_ID = 'Invalid id.';
const INVALID_DATAPOINT_UPLOAD_REQUEST =
  'Request for uploading a datapoint was invalid';
const INVALID_DATAPOINT_DELETE_REQUEST =
  'Request for deleting a datapoint was invalid';
const INVALID_DATAPOINT_UPDATE_REQUEST =
  'Request for updating a datapoint was invalid';
const INVALID_DATAPOINT_GET_REQUEST =
  'Request for getting datapoints was invalid';
const INVALID_FILE_REQUEST =
  'Request for file download was invalid';
const INVALID_ADD_TAG_REQUEST =
  'Request to add a tag was invalid.';
const INVALID_DELETE_TAG_REQUEST =
  'Request to delete a tag was invalid.';
const INVALID_GET_TAGS_REQUEST =
  'Request to get tags from datapoint was invalid.';

const NOT_FROM_A_USER =
  'Request was authenticated with a valid JWT but the JWT was not from a User';
const NOT_FROM_A_DEVICE =
  'Request was authenticated with a valid JWT but the JWT was not from' +
  ' a Device';


function send(response, data) {
  // Check that the data is valid.
  if (
    typeof data != 'object' ||
    typeof data.statusCode != 'number' ||
    typeof data.messages != 'object' ||
    typeof data.success != 'boolean'
  ) {
    // Responde with server error if data is invalid.
    log.error('Invalid response data');
    return serverError(response, data);
  }
  var statusCode = data.statusCode;
  delete data.statusCode;
  return response.status(statusCode).json(data);
}


//===========INVALID REQUESTS=============
function invalidDataId(response, message) {
  badRequest(response, [INVALID_ID, message]);
}

function invalidDatapointUpload(response, message) {
  badRequest(response, [INVALID_DATAPOINT_UPLOAD_REQUEST, message]);
}

function invalidDatapointDelete(response, message) {
  badRequest(response, [INVALID_DATAPOINT_DELETE_REQUEST, message]);
}

function invalidDatapointUpdate(response, message) {
  badRequest(response, [INVALID_DATAPOINT_UPDATE_REQUEST, message]);
}

function invalidDatapointGet(response, message) {
  badRequest(response, [INVALID_DATAPOINT_GET_REQUEST, message]);
}

function invalidFileRequest(response, message) {
  badRequest(response, [INVALID_FILE_REQUEST, message]);
}

function invalidAddTags(response, message) {
  badRequest(response, [INVALID_ADD_TAG_REQUEST, message]);
}

function invalidDeleteTags(response, message) {
  badRequest(response, [INVALID_DELETE_TAG_REQUEST, message]);
}

function invalidGetTags(response, message) {
  badRequest(response, [INVALID_GET_TAGS_REQUEST, message]);
}

function badRequest(response, messages) {
  send(response, { statusCode: 400, success: false, messages: messages });
}

//======VALID REQUESTS=========
function validRecordingUpload(response, idOfRecording) {
  send(response, {
    statusCode: 200,
    success: true,
    messages: [VALID_DATAPOINT_UPLOAD_REQUEST],
    recordingId: idOfRecording
  });
}

function validDatapointDelete(response) {
  send(response, {
    statusCode: 200,
    success: true,
    messages: [VALID_DATAPOINT_DELETE_REQUEST]
  });
}

function validDatapointUpdate(response) {
  send(response, {
    statusCode: 200,
    success: true,
    messages: [VALID_DATAPOINT_UPDATE_REQUEST]
  });
}

function validDatapointGet(response, result) {
  send(response, {
    statusCode: 200,
    success: true,
    messages: [VALID_DATAPOINT_GET_REQUEST],
    result: result,
  });
}

function validFileRequest(response, data) {
  send(response, {
    statusCode: 200,
    success: true,
    messages: [VALID_FILE_REQUEST],
    jwt: jwt.sign(data, config.server.passportSecret, { expiresIn: 60 * 10 }),
  });
}

function validAddTags(response) {
  send(response, {
    statusCode: 200,
    success: true,
    messages: [VALID_ADD_TAGS_REQUEST],
  });
}

function validDeleteTags(response) {
  send(response, {
    statusCode: 200,
    success: true,
    messages: [VALID_DELETE_TAGS_REQUEST]
  });
}

function validGetTags(response, tags) {
  send(response, {
    statusCode: 200,
    success: true,
    messages: [VALID_GET_TAGS_REQUEST],
    tags: tags,
  });
}

function validGetDatapoint(response, model) {
  send(response, {
    statusCode: 200,
    success: true,
    messages: [VALID_GET_MODEL],
    datapoint: model.getFrontendFields(),
  });
}

function serverError(response, err) {
  log.error(err);
  return response.status(500).json({
    success: false,
    messages: ["Server error. Sorry!"]
  });
}

function notFromAUser(response) {
  send(response, {
    statusCode: 401,
    success: false,
    messages: [NOT_FROM_A_USER]
  });
}

function notFromADevice(response) {
  send(response, {
    statusCode: 401,
    success: false,
    messages: [NOT_FROM_A_DEVICE]
  });
}

exports.send = send;
exports.invalidDataId = invalidDataId;
exports.invalidDatapointUpload = invalidDatapointUpload;
exports.invalidDatapointDelete = invalidDatapointDelete;
exports.invalidDatapointUpdate = invalidDatapointUpdate;
exports.invalidDatapointGet = invalidDatapointGet;
exports.invalidFileRequest = invalidFileRequest;
exports.invalidAddTags = invalidAddTags;
exports.invalidDeleteTags = invalidDeleteTags;
exports.invalidGetTags = invalidGetTags;
exports.validRecordingUpload = validRecordingUpload;
exports.validDatapointDelete = validDatapointDelete;
exports.validDatapointUpdate = validDatapointUpdate;
exports.validDatapointGet = validDatapointGet;
exports.validFileRequest = validFileRequest;
exports.validAddTags = validAddTags;
exports.validDeleteTags = validDeleteTags;
exports.validGetTags = validGetTags;
exports.validGetDatapoint = validGetDatapoint;
exports.serverError = serverError;
exports.notFromAUser = notFromAUser;
exports.notFromADevice = notFromADevice;
