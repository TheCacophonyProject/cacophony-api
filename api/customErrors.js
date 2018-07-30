const log    = require('../logging');
const format = require('util').format;

function errorHandler(err, request, response, next) { // eslint-disable-line
  if (err instanceof CustomError) {
    log.warn(err.toString());
    response.status(err.statusCode).json(err.toJson());
    return;
  }
  log.error(err);
  response.status(500).json({
    message: "server error",
    errorType: "server"
  });
}

function CustomError() {
  this.statusCode = 500;
}
CustomError.prototype = new Error();

function ValidationError(errors) {
  this.name = "validation";
  this.statusCode = 422;
  this.errors = errors;
  this.flatten = () => {
    const mappedErrors = this.errors.mapped();
    var errors = [];
    for (const name in mappedErrors) {
      const error = mappedErrors[name];
      if (typeof error.msg == "string") {
        errors.push(format(
          "%s: %s",
          name,
          error.msg,
        ));
      }
    }
    return errors.join('; ');
  };
  this.toString = () => {
    return format("%s error[%d]: %s", this.name, this.statusCode, this.flatten());
  };
  this.toJson = () => {
    return {
      errorType: this.name,
      message: this.flatten(),
      errors: this.errors.mapped(),
    };
  };
}
ValidationError.prototype = new CustomError();
ValidationError.prototype.constructor = ClientError;

function ClientError(message, statusCode) {
  if (statusCode == undefined) {
    statusCode = 400;
  }
  this.name = "client";
  this.message = message;
  this.statusCode = statusCode;
  this.toString = () => {
    return format("%s error[%d]: %s", this.name, statusCode, message);
  };
  this.toJson = () => {
    return {
      message: message,
      errorType: this.name,
    };
  };
}
ClientError.prototype = new CustomError();
ClientError.prototype.constructor = ClientError;

exports.ValidationError = ValidationError;
exports.ClientError     = ClientError;
exports.errorHandler    = errorHandler;
