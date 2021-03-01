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

import createServer = require("connect");
import http from "http";
import config from "../config";
import jwt from "jsonwebtoken";
import { ExtractJwt } from "passport-jwt";
import customErrors from "./customErrors";
import models, { ModelCommon } from "../models";

/*
 * Create a new JWT for a user or device.
 */
function createEntityJWT<T>(
  entity: ModelCommon<T>,
  options?,
  access?: {}
): string {
  const payload: {
    id: string;
    _type: string;
    access?: any;
  } = entity.getJwtDataValues();
  if (access) {
    payload.access = access;
  }
  return jwt.sign(payload, config.server.passportSecret, options);
}

const getVerifiedJWT = (req) => {
  const token = ExtractJwt.fromAuthHeaderWithScheme("jwt")(req);
  if (!token) {
    throw new customErrors.AuthenticationError("Could not find JWT token.");
  }
  try {
    return jwt.verify(token, config.server.passportSecret);
  } catch (e) {
    throw new customErrors.AuthenticationError("Failed to verify JWT.");
  }
};

/**
 * check requested auth access exists in jwt access object
 */
function checkAccess(reqAccess, jwtDecoded) {
  if (!reqAccess && jwtDecoded.access) {
    return false;
  }
  if (!jwtDecoded.access) {
    return true;
  }

  const reqKeys = Object.keys(reqAccess);
  if (reqKeys.length == 0 && jwtDecoded.access) {
    return false;
  }
  for (const key of reqKeys) {
    if (
      !jwtDecoded.access[key] ||
      jwtDecoded.access[key].indexOf(reqAccess[key]) == -1
    ) {
      return false;
    }
  }
  return true;
}

type AuthenticateMiddleware = (
  req,
  res,
  next
) => Promise<
  | ((
      req: http.IncomingMessage,
      res: http.ServerResponse,
      next: createServer.NextFunction
    ) => void)
  | undefined
>;
/*
 * Authenticate a JWT in the 'Authorization' header of the given type
 */
const authenticate = function (
  types: string[] | null,
  reqAccess?
): AuthenticateMiddleware {
  return async (req, res, next) => {
    let jwtDecoded;
    try {
      jwtDecoded = getVerifiedJWT(req);
    } catch (e) {
      return res.status(401).json({ messages: [e.message] });
    }

    if (types && !types.includes(jwtDecoded._type)) {
      res.status(401).json({ messages: ["Invalid JWT type."] });
      return;
    }
    const hasAccess = checkAccess(reqAccess, jwtDecoded);
    if (!hasAccess) {
      res.status(401).json({ messages: ["JWT does not have access."] });
      return;
    }
    const result = await lookupEntity(jwtDecoded);
    if (!result) {
      res.status(401).json({
        messages: ["Could not find entity referenced by JWT."]
      });
      return;
    }
    req[jwtDecoded._type] = result;
    next();
  };
};

async function lookupEntity(jwtDecoded) {
  switch (jwtDecoded._type) {
    case "user":
      return models.User.findByPk(jwtDecoded.id);
    case "device":
      return models.Device.findByPk(jwtDecoded.id);
    case "fileDownload":
      return jwtDecoded;
    default:
      return null;
  }
}

const authenticateUser: AuthenticateMiddleware = authenticate(["user"]);
const authenticateDevice: AuthenticateMiddleware = authenticate(["device"]);
const authenticateAny: AuthenticateMiddleware = authenticate(null);

const authenticateAccess = function (
  type: string[],
  access: Record<string, "r" | "w">
) {
  return authenticate(type, access);
};
const authenticateAdmin = async (req, res, next) => {
  let jwtDecoded;
  try {
    jwtDecoded = getVerifiedJWT(req);
  } catch (e) {
    res.status(401).send(e.message);
  }
  if (jwtDecoded._type != "user") {
    return res.status(403).json({ messages: ["Admin has to be a user"] });
  }
  const user = await models.User.findByPk(jwtDecoded.id);
  if (!user) {
    return res
      .status(401)
      .json({ messages: ["Could not find user from JWT."] });
  }
  if (!user.hasGlobalWrite()) {
    return res.status(403).json({ messages: ["User is not an admin."] });
  }
  req.admin = user;
  next();
};

/*
 * Authenticate a request using a "jwt" query parameter, with fallback
 * to Authorization header. The JWT must of a "user" type.
 */
async function paramOrHeader(req, res, next) {
  let token = req.query["jwt"];

  if (!token) {
    token = ExtractJwt.fromAuthHeaderWithScheme("jwt")(req);
  }
  if (!token) {
    res.status(401).json({ messages: ["Could not find JWT token."] });
    return;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.server.passportSecret);
  } catch (e) {
    res.status(401).json({ messages: ["Failed to verify JWT."] });
    return;
  }

  if (decoded._type !== "user") {
    res.status(401).json({ messages: ["Invalid JWT type."] });
    return;
  }

  // Ensure the user referenced by the JWT actually exists.
  const user = await lookupEntity(decoded);
  if (!user) {
    res.status(401).json({ messages: ["Invalid JWT entity."] });
    return;
  }

  req["user"] = user;
  next();
}

function signedUrl(req, res, next) {
  const jwtParam = req.query["jwt"];
  if (jwtParam == null) {
    return res
      .status(401)
      .json({ messages: ["Could not find JWT token in query params."] });
  }
  let jwtDecoded;
  try {
    jwtDecoded = jwt.verify(jwtParam, config.server.passportSecret);
  } catch (e) {
    return res.status(401).json({ messages: ["Failed to verify JWT."] });
  }

  if (jwtDecoded._type !== "fileDownload") {
    return res.status(401).json({ messages: ["Incorrect JWT type."] });
  }

  req.jwtDecoded = jwtDecoded;
  next();
}

// A request wrapper that also checks if user should be playing around with the
// the named device before continuing.
const userCanAccessDevices = async (request, response, next) => {
  let devices = [];
  if ("device" in request.body && request.body.device) {
    request["device"] = request.body.device;
    devices = [request.body.device.id];
  } else if ("devices" in request.body) {
    devices = request.body.devices;
  } else {
    next(new customErrors.ClientError("No devices specified.", 422));
    return;
  }

  if (!("user" in request)) {
    next(new customErrors.ClientError("No user specified.", 422));
    return;
  }

  try {
    await request.user.checkUserControlsDevices(devices);
  } catch (e) {
    return response.status(403).json({ messages: [e.message] });
  }
  next();
};

// A request wrapper that also checks if user should be playing around with the
// the group before continuing.
const userHasReadAccessToGroup = async (request, response, next) => {
  if (request.body.group) {
    request.group = request.body.group;
  } else {
    next(new customErrors.ClientError("No group specified.", 422));
    return;
  }

  if (!request.user) {
    next(new customErrors.ClientError("No user specified.", 422));
    return;
  }

  if (request.user.hasGlobalRead() || await request.user.isInGroup(request.body.group.id)) {
    next();
  } else {
    return response.status(403).json({ messages: ["User doesn't have permission to access group"] });
  }
};

// A request wrapper that also checks if user should be playing around with the
// the group before continuing.
const userHasWriteAccessToGroup = async (request, response, next) => {
  if (request.body.group) {
    request.group = request.body.group;
  } else {
    next(new customErrors.ClientError("No group specified.", 422));
    return;
  }

  if (!request.user) {
    next(new customErrors.ClientError("No user specified.", 422));
    return;
  }

  if (request.user.hasGlobalWrite() || await request.user.isGroupAdmin(request.body.group.id)) {
    next();
  } else {
    return response.status(403).json({ messages: ["User doesn't have permission to access group"] });
  }
};

export default {
  createEntityJWT,
  authenticateUser,
  authenticateDevice,
  authenticateAny,
  authenticateAccess,
  authenticateAdmin,
  paramOrHeader,
  signedUrl,
  userCanAccessDevices,
  userHasReadAccessToGroup,
  userHasWriteAccessToGroup
};
