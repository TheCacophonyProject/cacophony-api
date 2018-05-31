const log    = require('../logging');
const format = require('util').format;

function errorHandler(err, request, response, next) {
  if (err instanceof CustomError) {
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
  this.toJson = () => {
    const mappedErrors = this.errors.mapped();
    var errorList = [];
    for (var key in mappedErrors) {
      if (typeof mappedErrors[key].msg == "string") {
        var msg = format(
          "Parameter '%s' failed because: %s.\n",
          mappedErrors[key].param,
          mappedErrors[key].msg,
        );
        errorList.push(msg);
      }
    }
    return {
      message: errorList.join('. '),
      errorType: this.name,
      errors: this.errors.mapped(),
    };
  };
}
ValidationError.prototype = new CustomError();
ValidationError.prototype.constructor = ClientError;

function ClientError(message, httpStatusCode) {
  if (httpStatusCode == undefined) {
    httpStatusCode = 400;
  }
  this.message = message;
  this.name = "client";
  this.statusCode = httpStatusCode;
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
