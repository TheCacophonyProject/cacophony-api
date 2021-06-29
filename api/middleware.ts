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

import {
  body,
  oneOf,
  query,
  ValidationChain,
  ValidationChainBuilder,
  validationResult,
  ValidatorOptions
} from "express-validator/check";
import models, { ModelStaticCommon } from "../models";
import { format } from "util";
import log from "../logging";
import customErrors from "./customErrors";
import { RequestHandler, Response } from "express";

const getModelById = function <T>(
  modelType: ModelStaticCommon<T>,
  fieldName: string,
  checkFunc
) {
  return checkFunc(fieldName).custom(async (val, { req }) => {
    const model = await modelType.findByPk(val);
    if (model === null) {
      throw new Error(
        format("Could not find a %s with an id of %s.", modelType.name, val)
      );
    }
    req.body[modelTypeName(modelType)] = model;
    return true;
  });
};

const getModelByName = function <T>(
  modelType: ModelStaticCommon<T>,
  fieldName: string,
  checkFunc: ValidationChainBuilder
): ValidationChain {
  return checkFunc(fieldName).custom(async (val, { req }) => {
    const model: T = await modelType.getFromName(val);
    if (model === null) {
      throw new Error(format("Could not find %s of %s.", fieldName, val));
    }
    req.body[modelTypeName(modelType)] = model;
    return true;
  });
};

const getUserByEmail = function (
  checkFunc: ValidationChainBuilder,
  fieldName: string = "email"
): ValidationChain {
  return checkFunc(fieldName)
    .isEmail()
    .custom(async (email: string, { req }) => {
      email = email.toLowerCase();
      const user = await models.User.getFromEmail(email);
      if (user === null) {
        throw new Error(`Could not find user with email: ${email}`);
      }
      req.body.user = user;
      return true;
    });
};

function modelTypeName(modelType: ModelStaticCommon<any>): string {
  return modelType.options.name.singular.toLowerCase();
}

const ID_OR_ID_ARRAY_REGEXP = /^\[[0-9,]+\]$|^[0-9]+$/;
const ID_OR_ID_ARRAY_MESSAGE =
  "Must be an id, or an array of ids.  For example, '32' or '[32, 33, 34]'";

export const toIdArray = function (fieldName: string): ValidationChain {
  return query(fieldName, ID_OR_ID_ARRAY_MESSAGE)
    .matches(ID_OR_ID_ARRAY_REGEXP)
    .customSanitizer((value) => convertToIdArray(value));
};

const convertToIdArray = function (idsAsString: string): number[] {
  if (idsAsString) {
    try {
      const val = JSON.parse(idsAsString);
      if (Array.isArray(val)) {
        return val;
      } else {
        return [val];
      }
    } catch (error) {}
  }
  return [];
};

export const isInteger = function (
  fieldName: string,
  range: ValidatorOptions.IsIntOptions
): ValidationChain {
  // add an actually useful error to this isInt check
  const error = `Parameter '${fieldName}' must be an integer between ${range.min} and ${range.max}`;
  return query("page-size", error).isInt(range);
};

export const toDate = function (fieldName: string): ValidationChain {
  return query(fieldName, DATE_ERROR)
    .customSanitizer((value) => {
      return getAsDate(value);
    })
    .isInt();
};

const getAsDate = function (dateAsString: string): number {
  try {
    console.log("date is " + dateAsString);
    return Date.parse(dateAsString);
  } catch (error) {}
  return NaN;
};

const DATE_ERROR =
  "Must be a date or timestamp.   For example, '2017-11-13' or '2017-11-13T00:47:51.160Z'.";

const isDateArray = function (fieldName: string, customError): ValidationChain {
  return body(fieldName, customError)
    .exists()
    .custom((value) => {
      if (Array.isArray(value)) {
        value.forEach((dateAsString) => {
          if (isNaN(Date.parse(dateAsString))) {
            throw new Error(
              format(
                "Cannot parse '%s' into a date.  Try formatting the date like '2017-11-13T00:47:51.160Z'.",
                dateAsString
              )
            );
          }
        });
        return true;
      } else {
        throw new Error("Value should be an array.");
      }
    });
};

function getUserById(checkFunc: ValidationChainBuilder): ValidationChain {
  return getModelById(models.User, "userId", checkFunc);
}

function getUserByName(
  checkFunc: ValidationChainBuilder,
  fieldName: string = "username"
): ValidationChain {
  return getModelByName(models.User, fieldName, checkFunc);
}

function getUserByNameOrId(checkFunc: ValidationChainBuilder): RequestHandler {
  return oneOf(
    [getUserByName(checkFunc), getUserById(checkFunc)],
    "User doesn't exist or was not specified"
  );
}

function getGroupById(checkFunc: ValidationChainBuilder): ValidationChain {
  return getModelById(models.Group, "groupId", checkFunc);
}

function getGroupByName(
  checkFunc: ValidationChainBuilder,
  fieldName: string = "group"
) {
  return getModelByName(models.Group, fieldName, checkFunc);
}

function getGroupByNameOrId(checkFunc: ValidationChainBuilder): RequestHandler {
  return oneOf(
    [getGroupById(checkFunc), getGroupByName(checkFunc)],
    "Group doesn't exist or hasn't been specified."
  );
}

function getGroupByNameOrIdDynamic(
  checkFunc: ValidationChainBuilder,
  fieldName: string
): RequestHandler {
  return oneOf(
    [
      getModelById(models.Group, fieldName, checkFunc),
      getModelByName(models.Group, fieldName, checkFunc)
    ],
    "Group doesn't exist or hasn't been specified."
  );
}

function getDeviceById(checkFunc: ValidationChainBuilder): ValidationChain {
  return getModelById(models.Device, "deviceId", checkFunc);
}

function setGroupName(checkFunc: ValidationChainBuilder): ValidationChain {
  return checkFunc("groupname").custom(async (value, { req }) => {
    req.body["groupname"] = value;
    return true;
  });
}

function getDevice(
  checkFunc: ValidationChainBuilder,
  paramName: string = "devicename"
) {
  return checkFunc(paramName).custom(async (deviceName, { req }) => {
    const password = req.body["password"];
    const groupName = req.body["groupname"];
    const deviceID = req.body["deviceID"];
    const model = await models.Device.findDevice(
      deviceID,
      deviceName,
      groupName,
      password
    );
    if (model == null) {
      throw new Error(
        format("Could not find device %s in group %s.", deviceName, groupName)
      );
    }
    req.body["device"] = model;
    return true;
  });
}

function getDetailSnapshotById(
  checkFunc: ValidationChainBuilder,
  paramName: string
): ValidationChain {
  return getModelById(models.DetailSnapshot, paramName, checkFunc);
}

function getFileById(checkFunc: ValidationChainBuilder): ValidationChain {
  return getModelById(models.File, "id", checkFunc);
}

function getRecordingById(checkFunc: ValidationChainBuilder): ValidationChain {
  return getModelById(models.Recording, "id", checkFunc);
}

const isValidName = function (
  checkFunc: ValidationChainBuilder,
  field: string
): ValidationChain {
  return checkFunc(
    field,
    `${field} must only contain letters, numbers, dash, underscore and space.  It must contain at least one letter`
  )
    .isLength({ min: 3 })
    .matches(/(?=.*[A-Za-z])^[a-zA-Z0-9]+([_ \-a-zA-Z0-9])*$/);
};

const checkNewPassword = function (field: string): ValidationChain {
  return body(field, "Password must be at least 8 characters long").isLength({
    min: 8
  });
};

const viewMode = function (): ValidationChain {
  // All api listing commands will automatically return all results if the user is a super-admin
  // There is now an optional "view-mode" query param to these APIs, which, if set to "user",
  // will restrict results to items only directly viewable by the super-admin user.
  // The default behaviour remains unchanged, and this will do nothing for non-admin users.
  return query("view-mode").custom((value, { req }) => {
    req.body.viewAsSuperAdmin = value !== "user";
    return true;
  });
};

/**
 * Extract and decode a JSON object from the request object.
 * If the entry is a string, it will be converted to a proper object,
 * if it is already an object, it will stay the same. Either is acceptable,
 * however clients should migrate to sending objects directly if it's in the body.
 * @param field The field in the JSON object to get
 * @param checkFunc The express-validator function, typically `body` or `query`
 */
const parseJSON = function (
  field: string,
  checkFunc: ValidationChainBuilder
): ValidationChain {
  return checkFunc(field).custom((value, { req, location, path }) => {
    if (typeof req[location][path] === "string") {
      let result = value;
      while (typeof result === "string") {
        try {
          result = JSON.parse(result);
        } catch (e) {
          throw new Error(format("Could not parse JSON field %s.", path));
        }
      }
      if (typeof result !== "object") {
        throw new Error(format("JSON field %s is not an object", path));
      }
      req[location][path] = result;
    }
    return req[location][path] !== undefined;
  });
};

/**
 * Extract and decode an array from the request object.
 * If the entry is a string, it will be converted to a proper array,
 * if it is already an array, it will stay the same. Either is acceptable,
 * however clients should migrate to sending arrays directly if it's in the body.
 * NOTE: We need to keep parsing the JSON string until it is an object;
 *  a double-stringified object parsed once is still a string!
 * @param field The field in the JSON object to get
 * @param checkFunc The express-validator function, typically `body` or `query`
 */
const parseArray = function (
  field: string,
  checkFunc: ValidationChainBuilder
): ValidationChain {
  return checkFunc(field).custom((value, { req, location, path }) => {
    if (Array.isArray(value)) {
      return true;
    }
    let arr;
    try {
      arr = JSON.parse(value);
    } catch (e) {
      throw new Error(format("Could not parse JSON field %s.", path));
    }
    if (Array.isArray(arr)) {
      req[location][path] = arr;
      return true;
    } else if (arr === null) {
      req[location][path] = [];
      return true;
    } else {
      throw new Error(format("%s was not an array", path));
    }
  });
};

const parseBool = function (value: any): boolean {
  if (!value) {
    return false;
  }
  return value.toString().toLowerCase() == "true";
};

const requestWrapper = (fn) => (request, response: Response, next) => {
  let logMessage = format("%s %s", request.method, request.url);
  if (request.user) {
    logMessage = format(
      "%s (user: %s)",
      logMessage,
      request.user.get("username")
    );
  } else if (request.device) {
    logMessage = format(
      "%s (device: %s)",
      logMessage,
      request.device.get("devicename")
    );
  }
  log.info(logMessage);
  const validationErrors = validationResult(request);
  if (!validationErrors.isEmpty()) {
    throw new customErrors.ValidationError(validationErrors);
  } else {
    Promise.resolve(fn(request, response, next)).catch(next);
  }
};

export default {
  getUserById,
  getUserByName,
  getUserByNameOrId,
  getGroupById,
  getGroupByName,
  getGroupByNameOrId,
  getGroupByNameOrIdDynamic,
  getDeviceById,
  getDevice,
  getDetailSnapshotById,
  getFileById,
  getRecordingById,
  isValidName,
  checkNewPassword,
  parseJSON,
  parseArray,
  parseBool,
  requestWrapper,
  isDateArray,
  getUserByEmail,
  setGroupName,
  viewMode
};
