const models       = require('../models');
const config       = require('../config');
const jwt          = require('jsonwebtoken');
const format       = require('util').format;
const ExtractJwt   = require('passport-jwt').ExtractJwt;
const log          = require('../logging');
const customErrors = require('./customErrors');
const { body, check, header, validationResult, query } = require('express-validator/check');
/*
 * Authenticate a JWT in the 'Authorization' header of the given type
 */
const authenticate = function(type) {
  return header('Authorization').custom(async (value, {req}) => {
    const token = ExtractJwt.fromAuthHeaderWithScheme('jwt')(req);
    if (token == null) {
      throw new Error('could not find JWT token');
    }
    var jwtDecoded;
    try {
      jwtDecoded = jwt.verify(token, config.server.passportSecret);
    } catch(e) {
      throw new Error('failed to verify JWT');
    }

    if (type && type != jwtDecoded._type) {
      throw new Error(format('Invalid type of JWT. Need one of %s for this request, but had %s', type, jwtDecoded._type));
    }
    var result;
    switch(jwtDecoded._type) {
    case 'user':
      result = await models.User.findById(jwtDecoded.id);
      break;
    case 'device':
      result = await models.Device.findById(jwtDecoded.id);
      break;
    case 'fileDownload':
      result = jwtDecoded;
      break;
    }
    if (result == null) {
      throw new Error(format('could not find a %s from the JWT', type));
    }
    req[type] = result;
    return true;
  });
};

const authenticateUser         = authenticate('user');
const authenticateDevice       = authenticate('device');
const authenticateAny   = authenticate(null);

const signedUrl = query('jwt').custom((value, {req}) => {
  if (value == null) {
    throw new Error('could not find JWT token');
  }
  var jwtDecoded;
  try {
    jwtDecoded = jwt.verify(value, config.server.passportSecret);
  } catch(e) {
    throw new Error('failed to verify JWT');
  }
  req.jwtDecoded = jwtDecoded;
  return true;
});


const getModelById = function(modelType, fieldName, checkFunc=check) {
  return checkFunc(fieldName).custom(async (val, { req }) => {
    const model = await modelType.findById(val);
    if (model === null) {
      throw new Error(format('Could not find a %s with an id of %s', modelType.name, val));
    }
    req.body[modelTypeName(modelType)] = model;
    return true;
  });
};

const getModelByName = function(modelType, fieldName, checkFunc=check) {
  return checkFunc(fieldName).custom(async (val, { req }) => {
    const model = await modelType.getFromName(val);
    if (model === null) {
      throw new Error(format('could not find %s of %s', fieldName, val));
    }
    req.body[modelTypeName(modelType)] = model;
    return true;
  });
};

const getUserByEmail = body('email').isEmail().custom(async (email, { req }) => {
  const user = await models.User.getFromEmail(email);
  if (user === null) {
    throw new Error('could not find user with email: ' + email);
  }
  req.body.user = user;
  return true;
});

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

const getUserById = getModelById(models.User, 'userId');
const getUserByName = getModelByName(models.User, 'username');

const getGroupById = getModelById(models.Group, 'groupId');
const getGroupByName = getModelByName(models.Group, 'group');

const getDeviceById = getModelById(models.Device, 'deviceId');
const getDeviceByName = getModelByName(models.Device, 'devicename');

const getEventDetailById = getModelById(models.EventDetail, 'eventDetailId');

const getFileById = getModelById(models.File, 'id');

const checkNewName = function(field) {
  return body(field, 'invalid name')
    .isLength({ min: 3 })
    .matches(/^[a-zA-Z0-9]+(?:[_ -]?[a-zA-Z0-9])*$/);
};

const checkNewPassword = function(field) {
  return body(field, 'Invalid password.  Password must be at least 8 characters long.')
    .isLength({ min: 8 });
};

const parseJSON = function(field) {
  return check(field).custom((value, {req, location, path}) => {
    try {
      req[location][path] = JSON.parse(value);
      return true;
    } catch(e) {
      throw new Error(format('could not parse field %s to a json', path));
    }
  });
};

const parseArray = function(field) {
  return check(field).custom((value, {req, location, path}) => {
    var arr;
    try {
      arr = JSON.parse(value);
    } catch(e) {
      throw new Error(format('could not parse field %s to a json', path));
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

// A request wrapper that also checks if user should be playing around with the
// the named device before continuing.
function ifUsersDeviceRequestWrapper(fn) {
  var ifPermissionWrapper = async (request, response) => {
    let devices = [];
    if ("device" in request.body && request.body.device) {
      request["device"] = request.body.device;
      devices = [request.body.device.id];
    }
    else if ("devices" in request.body) {
      devices = request.body.devices;
    } else {
      throw new customErrors.ClientError("No devices specified.", 422);
    }

    if (!("user" in request)) {
      throw new customErrors("No user specified.", 422);
    }

    try {
      await request.user.checkUserControlsDevices(devices);
    }
    catch (error) {
      if (error.name == 'UnauthorizedDeviceException') {
        log.info(error.message);
        const cError = new customErrors.ClientError("User is not authorized for one (or more) of specified devices.", 422);
        cError.name = "authorisation";
        throw cError;
      } else {
        throw error;
      }
    }

    await fn(request, response);
  };
  return requestWrapper(ifPermissionWrapper);
}

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
      .catch(next);
  }
};

exports.authenticateUser   = authenticateUser;
exports.authenticateDevice = authenticateDevice;
exports.authenticateAny = authenticateAny;
exports.signedUrl          = signedUrl;
exports.getUserById        = getUserById;
exports.getUserByName      = getUserByName;
exports.getGroupById       = getGroupById;
exports.getGroupByName     = getGroupByName;
exports.getDeviceById      = getDeviceById;
exports.getDeviceByName    = getDeviceByName;
exports.getEventDetailById = getEventDetailById;
exports.getFileById        = getFileById;
exports.checkNewName       = checkNewName;
exports.checkNewPassword   = checkNewPassword;
exports.parseJSON          = parseJSON;
exports.parseArray         = parseArray;
exports.requestWrapper     = requestWrapper;
exports.ifUsersDeviceRequestWrapper = ifUsersDeviceRequestWrapper;
exports.isDateArray        = isDateArray;
exports.getUserByEmail     = getUserByEmail;
