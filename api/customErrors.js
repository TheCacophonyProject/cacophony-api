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

const log = require("../logging");
const format = require("util").format;

// eslint-disable-next-line no-unused-vars
function errorHandler(err, request, response, next) {
  if (err instanceof SyntaxError && err.type === "entity.parse.failed") {
    err = new ClientError(err.message, 422); // Convert invalid JSON body error to UnprocessableEntity
  }
  if (err instanceof CustomError) {
    log.warn(err.toString());
    return response.status(err.statusCode).json(err.toJson());
  }
  log.error(err);
  response.status(500).json({
    message: "Internal server error: " + err.name + ".",
    errorType: "server"
  });
}

class CustomError extends Error {
  constructor() {
    super();
    this.name = this.constructor.name;

    this.statusCode = 500;
    this.message = "Internal server error.";
  }

  getErrorType() {
    if (this.name.endsWith("Error")) {
      return this.name.toLowerCase().slice(0, -"Error".length);
    }
    return this.name.toLowerCase();
  }

  toString() {
    return format("%s [%d]: %s.", this.name, this.statusCode, this.message);
  }

  toJson() {
    return {
      message: this.message,
      errorType: this.getErrorType()
    };
  }
}

class ValidationError extends CustomError {
  constructor(errors) {
    super();
    this.statusCode = 422;
    this.errors = errors;

    const mappedErrors = this.errors.mapped();
    const errorStrings = [];
    for (const name in mappedErrors) {
      const error = mappedErrors[name];
      if (typeof error.msg == "string") {
        errorStrings.push(error.msg);
      }
    }
    this.message = errorStrings.join("; ");
  }

  toJson() {
    return {
      errorType: this.getErrorType(),
      message: this.message,
      errors: this.errors.mapped()
    };
  }
}

class AuthenticationError extends CustomError {
  constructor(message) {
    super();
    this.message = message;
    this.statusCode = 401;
  }
}

class AuthorizationError extends CustomError {
  constructor(message) {
    super();
    this.message = message;
    this.statusCode = 403;
  }
}

class ClientError extends CustomError {
  constructor(message, statusCode) {
    super();
    if (typeof statusCode === "undefined") {
      statusCode = 400;
    }
    this.message = message;
    this.statusCode = statusCode;
  }
}

exports.ValidationError = ValidationError;
exports.AuthenticationError = AuthenticationError;
exports.AuthorizationError = AuthorizationError;
exports.ClientError = ClientError;
exports.errorHandler = errorHandler;
