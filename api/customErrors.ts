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

import log from "../logging";
import { format } from "util";

// eslint-disable-next-line no-unused-vars
function errorHandler(err, request, response, next) {
  if (
    err instanceof SyntaxError &&
    (err as any).type === "entity.parse.failed"
  ) {
    err = new ClientError(err.message, 422); // Convert invalid JSON body error to UnprocessableEntity
  }
  if (err instanceof CustomError) {
    log.warn(err.toString());
    return response.status(err.statusCode).json(err.toJson());
  }
  log.error(err);
  response.status(500).json({
    message: "Internal server error: " + err.name + ".",
    errorType: "server",
  });
}

class CustomError extends Error {
  statusCode: number;
  constructor(
    message: string = "Internal server error.",
    statusCode: number = 500
  ) {
    super();
    this.name = this.constructor.name;
    this.message = message;
    this.statusCode = statusCode;
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
      errorType: this.getErrorType(),
    };
  }
}

class ValidationError extends CustomError {
  errors: Record<string, any>;
  constructor(errors) {
    const message = errors
      .array()
      .filter((error) => typeof error.msg === "string")
      .map((error) => error.msg)
      .join("; ");
    super(message, 422);
    this.errors = errors;
  }

  toJson() {
    return {
      errorType: this.getErrorType(),
      message: this.message,
      errors: this.errors.mapped(),
    };
  }
}

class AuthenticationError extends CustomError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class ClientError extends CustomError {
  constructor(message: string, statusCode: number = 400) {
    super(message, statusCode);
  }
}

export default {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ClientError,
  errorHandler,
};
