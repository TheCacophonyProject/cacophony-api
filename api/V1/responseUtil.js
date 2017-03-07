var log = require('../../logging');
var jwt = require('jsonwebtoken');
var config = require('../../config');

var INVALID_DATAPOINT_UPLOAD_REQUEST =
  'Request for uploading a datapoint was invalid';
var INVALID_DATAPOINT_DELETE_REQUEST =
  'Request for deleting a datapoint was invalid';
var INVALID_DATAPOINT_UPDATE_REQUEST =
  'Request for updating a datapoint was invalid';
var INVALID_DATAPOINT_GET_REQUEST =
  'Request for getting datapoints was invalid';
var INVALID_FILE_REQUEST =
  'Request for file download was invalid';
var VALID_DATAPOINT_UPLOAD_REQUEST =
  'Thanks for the data.';
var VALID_DATAPOINT_DELETE_REQUEST =
  'Datapoint deleted.';
var VALID_DATAPOINT_UPDATE_REQUEST =
  'Datapoint was updated.';
var VALID_DATAPOINT_GET_REQUEST =
  'Successful datapoint get request.';
var VALID_FILE_REQUEST =
  'Successful file request.';
var NOT_FROM_A_USER =
  'Request was authenticated with a valid JWT but the JWT was not from a User';
var NOT_FROM_A_DEVICE =
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

function badRequest(response, messages) {
  send(response, { statusCode: 400, success: false, messages: messages });
}

//======VALID REQUESTS=========
function validDatapointUpload(response, messages) {
  send(response, {
    statusCode: 200,
    success: true,
    messages: [VALID_DATAPOINT_UPLOAD_REQUEST]
  });
}

function validDatapointDelete(response, message) {
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
    jwt: jwt.sign(data, config.passport.secret, { expiresIn: 60 * 10 }),
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
exports.invalidDatapointUpload = invalidDatapointUpload;
exports.invalidDatapointDelete = invalidDatapointDelete;
exports.invalidDatapointUpdate = invalidDatapointUpdate;
exports.invalidDatapointGet = invalidDatapointGet;
exports.invalidFileRequest = invalidFileRequest;
exports.validDatapointUpload = validDatapointUpload;
exports.validDatapointDelete = validDatapointDelete;
exports.validDatapointUpdate = validDatapointUpdate;
exports.validDatapointGet = validDatapointGet;
exports.validFileRequest = validFileRequest;
exports.serverError = serverError;
exports.notFromAUser = notFromAUser;
exports.notFromADevice = notFromADevice;
