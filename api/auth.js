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

const config       = require('../config');
const jwt          = require('jsonwebtoken');
const ExtractJwt   = require('passport-jwt').ExtractJwt;
const customErrors = require('./customErrors');
const format       = require('util').format;
const models = require('../models');

const getVerifiedJWT = (req) => {
  const token = ExtractJwt.fromAuthHeaderWithScheme('jwt')(req);
  if (!token) {
    throw new customErrors.AuthenticationError('Could not find JWT token.');
  }
  try {
    return jwt.verify(token, config.server.passportSecret);
  } catch(e) {
    throw new customErrors.AuthenticationError('Failed to verify JWT.');
  }
};

/*
 * Authenticate a JWT in the 'Authorization' header of the given type
 */
const authenticate = function(type) {
  return async (req, res, next) => {
    let jwtDecoded;
    try {
      jwtDecoded = getVerifiedJWT(req);
    } catch(e) {
      return res.status(401).json({"messages": [e.message]});
    }
    if (type && type != jwtDecoded._type) {
      return res.status(401).json({"messages": [format('Invalid type of JWT. Need one of %s for this request, but had %s.', type, jwtDecoded._type)]});
    }
    let result;
    switch(jwtDecoded._type) {
    case 'user':
      result = await models.User.findByPk(jwtDecoded.id);
      break;
    case 'device':
      result = await models.Device.findByPk(jwtDecoded.id);
      break;
    case 'fileDownload':
      result = jwtDecoded;
      break;
    }
    if (result == null) {
      return res.status(401).json({"messages": [format('Could not find a %s from the JWT.', type)]});
    }
    req[type] = result;
    next();
  };
};

const authenticateUser   = authenticate('user');
const authenticateDevice = authenticate('device');
const authenticateAny    = authenticate(null);

const authenticateAdmin = async (req, res, next) => {
  let jwtDecoded;
  try {
    jwtDecoded = getVerifiedJWT(req);
  } catch(e) {
    res.status(401).send(e.message);
  }
  if (jwtDecoded._type != 'user') {
    return res.status(403).json({"messages": ['Admin has to be a user']});
  }
  const user = await models.User.findByPk(jwtDecoded.id);
  if (!user) {
    return res.status(401).json({"messages": ['Could not find user from JWT.']});
  }
  if (!user.hasGlobalWrite()) {
    return res.status(403).json({"messages": ['User is not an admin.']});
  }
  req.admin = user;
  next();
};

const signedUrl = (req, res, next) => {
  const jwtParam = req.query["jwt"];
  if (jwtParam == null) {
    return res.status(401).json({"messages": ['Could not find JWT token in query params.']});
  }
  let jwtDecoded;
  try {
    jwtDecoded = jwt.verify(jwtParam, config.server.passportSecret);
  } catch(e) {
    return res.status(401).json({"messages": ['Failed to verify JWT.']});
  }
  req.jwtDecoded = jwtDecoded;
  next();
};

// A request wrapper that also checks if user should be playing around with the
// the named device before continuing.
const userCanAccessDevices = async (request, response, next) => {
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
    throw new customErrors.ClientError("No user specified.", 422);
  }

  try {
    await request.user.checkUserControlsDevices(devices);
  } catch(e) {
    return response.status(403).json({"messages": [e.message]});
  }
  next();
};

exports.authenticateUser   = authenticateUser;
exports.authenticateDevice = authenticateDevice;
exports.authenticateAny    = authenticateAny;
exports.authenticateAdmin  = authenticateAdmin;
exports.signedUrl          = signedUrl;
exports.userCanAccessDevices = userCanAccessDevices;