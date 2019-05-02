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

const log = require('../logging');
const format = require('util').format;

function errorHandler(err, request, response, next) { // eslint-disable-line
  if (err instanceof CustomError) {
    log.warn(err.toString());
    response.status(err.statusCode).json(err.toJson());
    return;
  }
  log.error(err);
  response.status(500).json({
    message: "Server error.",
    errorType: "server"
  });
}

function CustomError() {
  this.statusCode = 500;
}
CustomError.prototype = new Error;

function ValidationError(errors) {
  this.name = "Validation";
  this.statusCode = 422;
  this.errors = errors;
  this.flatten = () => {
    const mappedErrors = this.errors.mapped();
    var errors = [];
    for (const name in mappedErrors) {
      const error = mappedErrors[name];
      if (typeof error.msg == "string") {
        errors.push(error.msg);
      }
    }
    return errors.join('; ');
  };
  this.toString = () => {
    return format("%s error[%d]: %s.", this.name, this.statusCode, this.flatten());
  };
  this.toJson = () => {
    return {
      errorType: this.name.toLowerCase(),
      message: this.flatten(),
      errors: this.errors.mapped(),
    };
  };
}
ValidationError.prototype = new CustomError;
ValidationError.prototype.constructor = ClientError;

function AuthenticationError(message) {
  this.name = "Authentication";
  this.message = message;
  this.statusCode = 401;
  this.toString = () => {
    return format("%s error[%d]: %s.", this.name, this.statusCode, this.message);
  };
  this.toJson = () => {
    return {
      message: this.message,
      errorType: this.name.toLowerCase(),
    };
  };
}

AuthenticationError.prototype = new CustomError;
AuthenticationError.prototype.constructor = AuthenticationError;

function AuthorizationError(message) {
  this.name = "AuthorizationError";
  this.message = message;
  this.statusCode = 403;
  this.toString = () => {
    return format("%s error[%d]: %s.", this.name, this.statusCode, this.message);
  };
  this.toJson = () => {
    return {
      message: this.message,
      errorType: this.name.toLowerCase(),
    };
  };
}

AuthorizationError.prototype = new CustomError;
AuthorizationError.prototype.constructor = AuthorizationError;

function ClientError(message, statusCode) {
  if (statusCode == undefined) {
    statusCode = 400;
  }
  this.name = "Client";
  this.message = message;
  this.statusCode = statusCode;
  this.toString = () => {
    return format("%s error[%d]: %s.", this.name, statusCode, message);
  };
  this.toJson = () => {
    return {
      message: message,
      errorType: this.name.toLowerCase(),
    };
  };
}
ClientError.prototype = new CustomError;
ClientError.prototype.constructor = ClientError;

exports.ValidationError = ValidationError;
exports.AuthenticationError = AuthenticationError;
exports.AuthorizationError = AuthorizationError;
exports.ClientError     = ClientError;
exports.errorHandler    = errorHandler;