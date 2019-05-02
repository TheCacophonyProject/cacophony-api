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

const models = require('../models');
const format       = require('util').format;
const log          = require('../logging');
const customErrors = require('./customErrors');
const {AuthorizationError, AuthenticationError} = require("./customErrors");
const { body, validationResult, oneOf } = require('express-validator/check');



const getModelById = function(modelType, fieldName, checkFunc) {
  return checkFunc(fieldName).custom(async (val, { req }) => {
    const model = await modelType.findByPk(val);
    if (model === null) {
      throw new Error(format('Could not find a %s with an id of %s.', modelType.name, val));
    }
    req.body[modelTypeName(modelType)] = model;
    return true;
  });
};

const getModelByName = function(modelType, fieldName, checkFunc) {
  return checkFunc(fieldName).custom(async (val, { req }) => {
    const model = await modelType.getFromName(val);
    if (model === null) {
      throw new Error(format('Could not find %s of %s.', fieldName, val));
    }
    req.body[modelTypeName(modelType)] = model;
    return true;
  });
};

const getUserByEmail = function(checkFunc, fieldName = 'email') {
  return checkFunc(fieldName).isEmail().custom(async (email, { req }) => {
    email = email.toLowerCase();
    const user = await models.User.getFromEmail(email);
    if (user === null) {
      throw new Error('Could not find user with email: ' + email);
    }
    req.body.user = user;
    return true;
  });
};

function modelTypeName(modelType) {
  return modelType.options.name.singular.toLowerCase();
}

const isDateArray = function(fieldName, customError) {
  return body(fieldName, customError).exists().custom((value) => {
    if (Array.isArray(value)) {
      value.forEach((dateAsString) => {
        if (isNaN(Date.parse(dateAsString))) {
          throw new Error(format("Cannot parse '%s' into a date.  Try formatting the date like '2017-11-13T00:47:51.160Z'.", dateAsString));
        }
      });
      return true;
    }
    else {
      throw new Error("Value should be an array.");
    }
  });
};

function getUserById(checkFunc) {
  return getModelById(models.User, 'userId', checkFunc);
}

function getUserByName(checkFunc, fieldName = 'username') {
  return getModelByName(models.User, fieldName, checkFunc);
}

function getUserByNameOrId(checkFunc) {
  return oneOf([
    getUserByName(checkFunc),
    getUserById(checkFunc),
  ], "User doesn't exist or was not specified");
}

function getGroupById(checkFunc) {
  return getModelById(models.Group, 'groupId', checkFunc);
}

function getGroupByName(checkFunc) {
  return getModelByName(models.Group, 'group', checkFunc);
}

function getGroupByNameOrId(checkFunc) {
  return oneOf([
    getGroupById(checkFunc),
    getGroupByName(checkFunc),
  ], "Group doesn't exist or hasn't been specified.");
}

function getDeviceById(checkFunc) {
  return getModelById(models.Device, 'deviceId', checkFunc);
}

function getDeviceByName(checkFunc) {
  return getModelByName(models.Device, 'devicename', checkFunc);
}

function getDetailSnapshotById(checkFunc, paramName) {
  return getModelById(models.DetailSnapshot, paramName, checkFunc);
}

function getFileById(checkFunc) {
  return getModelById(models.File, 'id', checkFunc);
}

function getRecordingById(checkFunc) {
  return getModelById(models.Recording, 'id', checkFunc);
}

const checkNewName = function(field) {
  return body(field, 'Invalid '+field)
    .isLength({ min: 3 })
    .matches(/^[a-zA-Z0-9]+(?:[_ -]?[a-zA-Z0-9])*$/);
};

const checkNewPassword = function(field) {
  return body(field, 'Password must be at least 8 characters long')
    .isLength({ min: 8 });
};

const parseJSON = function(field, checkFunc) {
  return checkFunc(field).custom((value, {req, location, path}) => {
    try {
      req[location][path] = JSON.parse(value);
      return true;
    } catch(e) {
      throw new Error(format('Could not parse JSON field %s.', path));
    }
  });
};

const parseArray = function(field, checkFunc) {
  return checkFunc(field).custom((value, {req, location, path}) => {
    var arr;
    try {
      arr = JSON.parse(value);
    } catch(e) {
      throw new Error(format('Could not parse JSON field %s.', path));
    }
    if (Array.isArray(arr)) {
      req[location][path] = arr;
      return true;
    } else if (arr === null) {
      req[location][path] = [];
      return true;
    } else {
      throw new Error(format('%s was not an array', path));
    }
  });
};



const requestWrapper = fn => (request, response, next) => {
  var logMessage = format('%s %s', request.method, request.url);
  if (request.user) {
    logMessage = format('%s (user: %s)',
      logMessage,
      request.user.get("username")
    );
  } else if (request.device) {
    logMessage = format('%s (device: %s)',
      logMessage,
      request.device.get("devicename")
    );
  }
  log.info(logMessage);
  const validationErrors = validationResult(request);
  if (!validationErrors.isEmpty()) {
    throw new customErrors.ValidationError(validationErrors);
  } else {
    Promise.resolve(fn(request, response, next))
      .catch(e => {
        if (e instanceof AuthenticationError) {
          return response.status(401).json({messages: [e.message]});
        }
        if (e instanceof AuthorizationError) {
          return response.status(403).json({messages: [e.message]});
        }
        throw e;
      })
      .catch((err) => { log.error("Unknown error: " + err + "\n" + err.stack); next();});
  }
};


exports.getUserById        = getUserById;
exports.getUserByName      = getUserByName;
exports.getUserByNameOrId  = getUserByNameOrId;
exports.getGroupById       = getGroupById;
exports.getGroupByName     = getGroupByName;
exports.getGroupByNameOrId = getGroupByNameOrId;
exports.getDeviceById      = getDeviceById;
exports.getDeviceByName    = getDeviceByName;
exports.getDetailSnapshotById = getDetailSnapshotById;
exports.getFileById        = getFileById;
exports.getRecordingById   = getRecordingById;
exports.checkNewName       = checkNewName;
exports.checkNewPassword   = checkNewPassword;
exports.parseJSON          = parseJSON;
exports.parseArray         = parseArray;
exports.requestWrapper     = requestWrapper;
exports.isDateArray        = isDateArray;
exports.getUserByEmail     = getUserByEmail;
