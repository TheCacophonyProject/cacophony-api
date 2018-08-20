var log = require('../../logging');
var jwt = require('jsonwebtoken');
var config = require('../../config');

const VALID_DATAPOINT_UPLOAD_REQUEST = 'Thanks for the data.';
const VALID_DATAPOINT_UPDATE_REQUEST = 'Datapoint was updated.';
const VALID_DATAPOINT_GET_REQUEST = 'Successful datapoint get request.';
const VALID_FILE_REQUEST = 'Successful file request.';

const INVALID_DATAPOINT_UPLOAD_REQUEST = 'Request for uploading a datapoint was invalid';
const INVALID_DATAPOINT_UPDATE_REQUEST = 'Request for updating a datapoint was invalid';


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


function invalidDatapointUpload(response, message) {
  badRequest(response, [INVALID_DATAPOINT_UPLOAD_REQUEST, message]);
}

function invalidDatapointUpdate(response, message) {
  badRequest(response, [INVALID_DATAPOINT_UPDATE_REQUEST, message]);
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

function serverError(response, err) {
  log.error(err);
  return response.status(500).json({
    success: false,
    messages: ["Server error. Sorry!"]
  });
}


exports.send = send;
exports.invalidDatapointUpload = invalidDatapointUpload;
exports.invalidDatapointUpdate = invalidDatapointUpdate;
exports.validRecordingUpload = validRecordingUpload;
exports.validDatapointUpdate = validDatapointUpdate;
exports.validDatapointGet = validDatapointGet;
exports.validFileRequest = validFileRequest;
exports.serverError = serverError;
