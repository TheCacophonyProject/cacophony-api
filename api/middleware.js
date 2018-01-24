const ExtractJwt   = require('passport-jwt').ExtractJwt;
const jwt          = require('jsonwebtoken');
const log          = require('../logging');
const responseUtil = require('./V1/responseUtil');
const models       = require('../models');
const config       = require('../config/config');
const { validationResult } = require('express-validator/check');

const logging = (request, response, next) => {
  log.info(request.method + 'Request: ' + request.url);
  next();
};

const parseParams = (options) => {
  return (request, response, next) => {

    var errorMessages = [];
    request.parsed = {};

    for (var group in options) {
      request.parsed[group] = {};
      for (var key in options[group]) {
        var errMessage;
        [request.parsed[group][key], errMessage] = parseOption(
          options[group][key], request[group][key]);
        if (errMessage != null) {
          errorMessages.push('Error with parsing ' + key + ': ' + errMessage);
        }
      }
    }

    if (errorMessages.length > 0) {
      return responseUtil.send(response, {
        statusCode: 400,
        success: false,
        messages: errorMessages,
      });
    } else {
      next();
    }
  };
};


const parseOption = (paramSettings, rawValue) => {
  if (paramSettings.required == false && typeof rawValue == 'undefined') {
    return [undefined, null];
  }
  switch(paramSettings.type) {
  case 'STRING':
    return parseString(rawValue);
  case 'INTEGER':
    return parseInteger(rawValue);
  case 'JSON':
    return parseJSON(rawValue);
  }
};

const parseString = (value) => {
  return [value, null];
};

const parseInteger = (value) => {
  if (isNaN(value)) {
    return [null, '\'' + value + '\' is not a valid integer.'];
  }
  return [value, null];
};

const parseJSON = (value) => {
  try {
    const parsedJSON = JSON.parse(value);
    if (typeof parsedJSON != 'object') {
      return [null, '\'' + value + '\' is not a valid JSON.'];
    }
    return [parsedJSON, null];
  } catch(e) {
    return [null, 'Failed to parse \'' + value + '\' to a JSON.'];
  }
};

/**
*
*/
const authenticate = (type) => {
  return async (request, response, next) => {
    const token = ExtractJwt.fromAuthHeader()(request);
    if (token == null) {
      return responseUtil.send(response, {
        statusCode: 400,
        success: false,
        messages: ['No JWT was found.'],
      });
    }
    try {
      var jwtDecoded = jwt.verify(token, config.server.passportSecret);
    } catch(e) {
      return responseUtil.send(response, {
        statusCode: 400,
        success: false,
        messages: ['Vailed to verify the JWT.'],
      });
    }
    if (jwtDecoded._type != type) {
      return responseUtil.send(response, {
        statusCode: 400,
        success: false,
        messages: ['A "' + jwtDecoded._type + '" JWT was given when it should be a "' + type + '" JWT'],
      });
    }
    try {
      switch(jwtDecoded._type) {
      case 'user':
        request.user = await parseJWTUser(jwtDecoded);
        break;
      case 'device':
        request.device = await parseJWTDevice(jwtDecoded);
        break;
      case 'fileDownload':
        request.fileDownload = jwtDecoded;
        break;
      default:
        return responseUtil.send(response, {
          statusCode: 400,
          success: false,
          messages: ['unknown JWT type'],
        });
      }
    } catch(err) {
      next(err);
    }
    next();
  };
};

const parseJWTUser = async (jwtDecoded) =>  {
  const user = await models.User.findById(jwtDecoded.id);
  if (user == null) {
    const err = new Error();
    err.message = 'user not found from JWT';
    throw err;
  }
  return user;
};

const parseJWTDevice = async (jwtDecoded) => {
  const device = await models.Device.findById(jwtDecoded.id);
  if (device == null) {
    const err = new Error();
    err.message = 'device not found from JWT';
    throw err;
  }
  return device;
};

/**
 * Wraps the function in a Promise and will properly pass errors to next.
 */
const validateAsyncWrapper = fn => (request, response, next) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    response.status(422).json({ errors: errors.mapped() });
  } else {
    Promise.resolve(fn(request, response, next))
      .catch(next);
  }
};

exports.logging = logging;
exports.parseParams = parseParams;
exports.validateAsyncWrapper = validateAsyncWrapper;
exports.authenticate = authenticate;
