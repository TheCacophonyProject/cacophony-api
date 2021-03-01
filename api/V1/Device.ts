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

import middleware from "../middleware";
import auth from "../auth";
import models from "../../models";
import responseUtil from "./responseUtil";
import { body, param, query } from "express-validator/check";
import Sequelize from "sequelize";
import { Application } from "express";

const Op = Sequelize.Op;

export default function (app: Application, baseUrl: string) {
  const apiUrl = `${baseUrl}/devices`;

  /**
   * @api {post} /api/v1/devices Register a new device
   * @apiName RegisterDevice
   * @apiGroup Device
   *
   * @apiParam {String} devicename Unique device name.
   * @apiParam {String} password Password for the device.
   * @apiParam {String} group Group to assign the device to.
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {String} token JWT for authentication. Contains the device ID and type.
   * @apiSuccess {int} id of device registered
   * @apiUse V1ResponseError
   */
  app.post(
    apiUrl,
    [
      middleware.getGroupByName(body),
      middleware.checkNewName("devicename"),
      middleware.checkNewPassword("password")
    ],
    middleware.requestWrapper(async (request, response) => {
      if (
        !(await models.Device.freeDevicename(
          request.body.devicename,
          request.body.group.id
        ))
      ) {
        return responseUtil.send(response, {
          statusCode: 422,
          messages: ["Device name in use."]
        });
      }
      const device = await models.Device.create({
        devicename: request.body.devicename,
        password: request.body.password,
        GroupId: request.body.group.id
      });

      await device.update({
        saltId: device.id
      });

      return responseUtil.send(response, {
        statusCode: 200,
        messages: ["Created new device."],
        id: device.id,
        token: "JWT " + auth.createEntityJWT(device)
      });
    })
  );

  /**
   * @api {get} /api/v1/devices Get list of devices
   * @apiName GetDevices
   * @apiGroup Device
   * @apiParam onlyActive {Boolean} Only return active devices, defaults to 'true'
   * If we want to return *all* devices this must be present and set to 'false'
   *
   * @apiDescription Returns all devices the user can access
   * through both group membership and direct assignment.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {JSON} devices Object with two entries, a count integer that is the number of rows returned, and
   * rows, which is an array of devices accessible.
   * Each element in rows includes `devicename` (string), `id` (int), and `Users` which is an array of Users with permissions on that device.
   *
   * @apiUse V1ResponseError
   */
  app.get(
    apiUrl,
    [
        auth.authenticateUser,
        param("onlyActive").optional().isBoolean().toBoolean(),
    ],
    middleware.requestWrapper(async (request, response) => {
      const onlyActiveDevices = request.param.onlyActive !== false;
      const devices = await models.Device.allForUser(request.user, onlyActiveDevices);
      return responseUtil.send(response, {
        devices: devices,
        statusCode: 200,
        messages: ["Completed get devices query."]
      });
    })
  );

  /**
   * @api {get} /api/v1/devices/users Get all users who can access a device.
   * @apiName GetDeviceUsers
   * @apiGroup Device
   * @apiDescription Returns all users that have access to the device
   * through both group membership and direct assignment.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {Number} deviceId ID of the device.
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {JSON} rows Array of users who have access to the
   * device. Each element includes `id` (user id), `username`, `email`,
   * `relation` (either `group` or `device`) and `admin` (boolean).
   * @apiUse V1ResponseError
   */
  app.get(
    `${apiUrl}/users`,
    [auth.authenticateUser, middleware.getDeviceById(query)],
    middleware.requestWrapper(async (request, response) => {
      let users = await request.body.device.users(request.user);

      users = users.map((u) => {
        u = u.get({ plain: true });

        // Extract the useful parts from DeviceUsers/GroupUsers.
        if (u.DeviceUsers) {
          u.relation = "device";
          u.admin = u.DeviceUsers.admin;
          delete u.DeviceUsers;
        } else if (u.GroupUsers) {
          u.relation = "group";
          u.admin = u.GroupUsers.admin;
          delete u.GroupUsers;
        }

        return u;
      });

      return responseUtil.send(response, {
        statusCode: 200,
        messages: ["OK."],
        rows: users
      });
    })
  );

  /**
   * @api {post} /api/v1/devices/users Add a user to a device.
   * @apiName AddUserToDevice
   * @apiGroup Device
   * @apiDescription This call adds a user to a device. This allows individual
   * user accounts to monitor a devices without being part of the group that the
   * device belongs to.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {Number} deviceId ID of the device.
   * @apiParam {Number} username Name of the user to add to the device.
   * @apiParam {Boolean} admin If true, the user should have administrator access to the device..
   *
   * @apiUse V1ResponseSuccess
   * @apiUse V1ResponseError
   */
  app.post(
    `${apiUrl}/users`,
    [
      auth.authenticateUser,
      middleware.getUserByNameOrId(body),
      middleware.getDeviceById(body),
      body("admin").isIn(["true", "false"])
    ],
    middleware.requestWrapper(async (request, response) => {
      const added = await models.Device.addUserToDevice(
        request.user,
        request.body.device,
        request.body.user,
        request.body.admin
      );

      if (added) {
        return responseUtil.send(response, {
          statusCode: 200,
          messages: ["Added user to device."]
        });
      } else {
        return responseUtil.send(response, {
          statusCode: 400,
          messages: ["Failed to add user to device."]
        });
      }
    })
  );

  /**
   * @api {delete} /api/v1/devices/users Removes a user from a device.
   * @apiName RemoveUserFromDevice
   * @apiGroup Device
   * @apiDescription This call can remove a user from a device. Has to be
   * authenticated by an admin from the group that the device belongs to or a
   * user that has control of device.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {Number} username name of the user to delete from the device.
   * @apiParam {Number} deviceId ID of the device.
   *
   * @apiUse V1ResponseSuccess
   * @apiUse V1ResponseError
   */
  app.delete(
    `${apiUrl}/users`,
    [
      auth.authenticateUser,
      middleware.getDeviceById(body),
      middleware.getUserByNameOrId(body)
    ],
    middleware.requestWrapper(async function (request, response) {
      const removed = await models.Device.removeUserFromDevice(
        request.user,
        request.body.device,
        request.body.user
      );

      if (removed) {
        return responseUtil.send(response, {
          statusCode: 200,
          messages: ["Removed user from the device."]
        });
      } else {
        return responseUtil.send(response, {
          statusCode: 400,
          messages: ["Failed to remove user from the device."]
        });
      }
    })
  );

  /**
   * @api {post} /api/v1/devices/reregister Reregister the device.
   * @apiName Reregister
   * @apiGroup Device
   * @apiDescription This call is to reregister a device to change the name and/or group
   *
   * @apiUse V1DeviceAuthorizationHeader
   *
   * @apiParam {String} newName new name of the device.
   * @apiParam {String} newGroup name of the group you want to move the device to.
   * @apiParam {String} newPassword password for the device
   *
   * @apiUse V1ResponseSuccess
   * @apiUse V1ResponseError
   */
  app.post(
    `${apiUrl}/reregister`,
    [
      auth.authenticateDevice,
      middleware.getGroupByName(body, "newGroup"),
      middleware.checkNewName("newName"),
      middleware.checkNewPassword("newPassword")
    ],
    middleware.requestWrapper(async function (request, response) {
      const device = await request.device.reregister(
        request.body.newName,
        request.body.group,
        request.body.newPassword
      );
      return responseUtil.send(response, {
        statusCode: 200,
        messages: ["Registered the device again."],
        id: device.id,
        token: "JWT " + auth.createEntityJWT(device)
      });
    })
  );

  /**
   * @api {get} /api/v1/devices/query Query devices by groups or devices.
   * @apiName query
   * @apiGroup Device
   * @apiDescription This call is to query all devices by groups or devices
   *
   * @apiUse V1DeviceAuthorizationHeader
   *
   * @apiParam {JSON} array of Devices
   * @apiParamExample {JSON} Device:
   * {
   *   "devicename":"newdevice",
   *   "groupname":"newgroup"
   * }
   * @apiParam {String} groups array of group names.
   * @apiParam {String} operator to use. Default is "or".
   * Accepted values are "and" or "or".
   * @apiSuccess {JSON} devices Array of devices which match fully (group or group and devicename)
   * @apiSuccess {JSON} nameMatches Array of devices which match only on devicename
   * @apiUse V1ResponseSuccess
   * @apiUse V1ResponseError
   */
  app.get(
    `${apiUrl}/query`,
    [
      middleware.parseJSON("devices", query).optional(),
      middleware.parseArray("groups", query).optional(),

      query("operator").isIn(["or", "and", "OR", "AND"]).optional(),
      auth.authenticateAccess(["user"], { devices: "r" })
    ],
    middleware.requestWrapper(async function (request, response) {
      if (
        request.query.operator &&
        request.query.operator.toLowerCase() == "and"
      ) {
        request.query.operator = Op.and;
      } else {
        request.query.operator = Op.or;
      }

      const devices = await models.Device.queryDevices(
        request.user,
        request.query.devices,
        request.query.groups,
        request.query.operator
      );
      return responseUtil.send(response, {
        statusCode: 200,
        devices: devices.devices,
        nameMatches: devices.nameMatches,
        messages: ["Completed get devices query."]
      });
    })
  );

  /**
   * @api {get} /api/v1/devices/{:deviceId}/cacophony-index Get the cacophony index for a device
   * @apiName cacophony-index
   * @apiGroup Device
   * @apiDescription Get a single number Cacophony Index
   * for a given device.  This number is the average of all the Cacophony Index values from a
   * given time (defaulting to 'Now'), within a given timespan (defaulting to 3 months)
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {Integer} deviceId ID of the device.
   * @apiParam {String} from ISO8601 date string
   * @apiParam {String} window-size length of rolling window in hours.  Default is 2160 (90 days)
   * @apiSuccess {Float} cacophonyIndex A number representing the average index over the period `from` minus `window-size`
   * @apiUse V1ResponseSuccess
   * @apiUse V1ResponseError
   */
  app.get(
    `${apiUrl}/:deviceId/cacophony-index`,
    [
      param("deviceId").isInt().toInt(),
      query("from").isISO8601().toDate().optional(),
      query("window-size").isInt().toInt().optional(),
      auth.authenticateUser
    ],
    middleware.requestWrapper(async function (request, response) {
      const cacophonyIndex = await models.Device.getCacophonyIndex(
        request.user,
        request.params.deviceId,
        request.query.from || new Date(), // Get the current cacophony index
        typeof request.query["window-size"] === "number"
          ? request.query["window-size"]
          : 2160 // Default to a three month rolling window
      );
      return responseUtil.send(response, {
        statusCode: 200,
        cacophonyIndex,
        messages: []
      });
    })
  );

  /**
   * @api {get} /api/v1/devices/{:deviceId}/cacophony-index-histogram Get the cacophony index 24hr histogram for a device
   * @apiName cacophony-index-histogram
   * @apiGroup Device
   * @apiDescription Get a histogram of the Cacophony Index
   * for a given device, bucketed by hour of the day.  These buckets are the average of all the Cacophony Index values
   * for each hour of the day, taken from a given time (defaulting to 'Now'), within a given timespan (defaulting to 3 months)
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {Integer} deviceId ID of the device.
   * @apiParam {String} from ISO8601 date string
   * @apiParam {Integer} window-size length of window in hours going backwards in time from the `from` param.  Default is 2160 (90 days)
   * @apiSuccess {Object} cacophonyIndex in the format `[{hour: number, index: number}, ...]`
   * @apiUse V1ResponseSuccess
   * @apiUse V1ResponseError
   */
  app.get(
    `${apiUrl}/:deviceId/cacophony-index-histogram`,
    [
      param("deviceId").isInt().toInt(),
      query("from").isISO8601().toDate().optional(),
      query("window-size").isInt().toInt().optional(),
      auth.authenticateUser
    ],
    middleware.requestWrapper(async function (request, response) {
      const cacophonyIndex = await models.Device.getCacophonyIndexHistogram(
        request.user,
        request.params.deviceId,
        request.query.from || new Date(), // Get the current cacophony index
        typeof request.query["window-size"] === "number"
          ? request.query["window-size"]
          : 2160 // Default to a three month rolling window
      );
      return responseUtil.send(response, {
        statusCode: 200,
        cacophonyIndex,
        messages: []
      });
    })
  );
}
