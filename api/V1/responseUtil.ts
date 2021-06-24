/*
cacophony-api: The Cacophony Project API server
Copyright (C) 2018  The Cacophony Project

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import log from "../../logging";
import jwt from "jsonwebtoken";
import config from "../../config";
import { Response } from "express";

const VALID_DATAPOINT_UPLOAD_REQUEST = "Thanks for the data.";
const VALID_DATAPOINT_UPDATE_REQUEST = "Datapoint was updated.";
const VALID_DATAPOINT_GET_REQUEST = "Successful datapoint get request.";
const VALID_FILE_REQUEST = "Successful file request.";

const INVALID_DATAPOINT_UPLOAD_REQUEST =
  "Request for uploading a datapoint was invalid.";
const INVALID_DATAPOINT_UPDATE_REQUEST =
  "Request for updating a datapoint was invalid.";

function send(response: Response, data: any) {
  // Check that the data is valid.
  if (
    typeof data !== "object" ||
    typeof data.statusCode !== "number" ||
    typeof data.messages !== "object"
  ) {
    // Respond with server error if data is invalid.
    return serverError(response, data);
  }
  const statusCode = data.statusCode;
  data.success = 200 <= statusCode && statusCode <= 299;
  delete data.statusCode;
  return response.status(statusCode).json(data);
}

function invalidDatapointUpload(response: Response, message: string) {
  badRequest(response, [INVALID_DATAPOINT_UPLOAD_REQUEST, message]);
}

function invalidDatapointUpdate(response: Response, message: string) {
  badRequest(response, [INVALID_DATAPOINT_UPDATE_REQUEST, message]);
}

function badRequest(response: Response, messages: string[]) {
  send(response, { statusCode: 400, messages });
}

//======VALID REQUESTS=========
function validRecordingUpload(response, idOfRecording) {
  send(response, {
    statusCode: 200,
    messages: [VALID_DATAPOINT_UPLOAD_REQUEST],
    recordingId: idOfRecording
  });
}

function validDatapointUpdate(response) {
  send(response, {
    statusCode: 200,
    messages: [VALID_DATAPOINT_UPDATE_REQUEST]
  });
}

function validDatapointGet(response, result) {
  send(response, {
    statusCode: 200,
    messages: [VALID_DATAPOINT_GET_REQUEST],
    result: result
  });
}

function validFileRequest(response, data) {
  send(response, {
    statusCode: 200,
    messages: [VALID_FILE_REQUEST],
    jwt: jwt.sign(data, config.server.passportSecret, { expiresIn: 60 * 10 })
  });
}

function serverError(
  response: Response,
  err,
  message = "Server error. Sorry!"
) {
  log.error(err);
  return response.status(500).json({
    messages: [message]
  });
}

export default {
  send,
  invalidDatapointUpdate,
  invalidDatapointUpload,
  validDatapointGet,
  validDatapointUpdate,
  validRecordingUpload,
  validFileRequest,
  serverError
};
