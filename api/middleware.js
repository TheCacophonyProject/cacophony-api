const models     = require('../models');
const config     = require('../config');
const jwt        = require('jsonwebtoken');
const format     = require('util').format;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const log        = require('../logging');
const { body, check, header, validationResult, query } = require('express-validator/check');
/*
 * Authenticate a JWT in the 'Authorization' header of the given type
 */
const authenticate = function(type) {
  return header('Authorization').custom(async (value, {req}) => {
    const token = ExtractJwt.fromAuthHeader()(req);
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

const requestWrapper = fn => (request, response, next) => {
  log.info(format('%s Request: %s', request.method, request.url));
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    response.status(422).json({ errors: errors.mapped() });
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
exports.isDateArray        = isDateArray;
