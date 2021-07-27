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
import { AccessLevel } from "../../models/GroupUsers";
import { AuthorizationError } from "../customErrors";

const Op = Sequelize.Op;

export default function (app: Application, baseUrl: string) {
  const apiUrl = `${baseUrl}/devices`;

  /**
   * @api {post} /api/v1/devices Register a new device
   * @apiName RegisterDevice
   * @apiGroup Device
   *
   * @apiParam {String} devicename Unique (within group) device name.
   * @apiParam {String} password Password for the device.
   * @apiParam {String} group Name of group to assign the device to.
   * @apiParam {Integer} [saltId] Salt ID of device. Will be set as device id if not given.
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {String} token JWT for authentication. Contains the device ID and type.
   * @apiSuccess {int} id id of device registered
   * @apiSuccess {int} saltId saltId of device registered
   * @apiUse V1ResponseError
   */
  app.post(
    apiUrl,
    [
      middleware.getGroupByName(body),
      middleware.isValidName(body, "devicename"),
      middleware.checkNewPassword("password"),
      body("saltId").optional().isInt()
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

      if (request.body.saltId) {
        await device.update({ saltId: request.body.saltId });
      } else {
        await device.update({ saltId: device.id });
      }

      return responseUtil.send(response, {
        statusCode: 200,
        messages: ["Created new device."],
        id: device.id,
        saltId: device.saltId,
        token: "JWT " + auth.createEntityJWT(device)
      });
    })
  );

  /**
   * @api {get} /api/v1/devices Get list of devices
   * @apiName GetDevices
   * @apiGroup Device
   * @apiParam {Boolean} [onlyActive] Only return active devices, defaults to `true`
   * If we want to return *all* devices this must be present and set to `false`
   * @apiParam {string} [view-mode] `"user"` show only devices assigned to current user where
   * JWT Authorization supplied is for a superuser (default for superuser is to show all devices)
   *
   * @apiDescription Returns all devices the user can access
   * through both group membership and direct assignment.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {JSON} devices Devices details
   * @apiSuccessExample {JSON} devices:
   * {
   * "count":1,
   * "rows":
   *  [{
   *   "devicename":"device name",
   *   "id":3836,
   *   "active":true,
   *   "Users":Array[]
   *   "Group":{}
   *  }]
   * }
   * @apiSuccessExample {JSON} Users:
   * [{
   *  "id":1564,
   *  "username":"user name",
   *  "DeviceUsers":
   *   {
   *    "admin":false,
   *    "createdAt":"2021-07-20T01:00:44.467Z",
   *    "updatedAt":"2021-07-20T01:00:44.467Z",
   *    "DeviceId":3836,
   *    "UserId":1564
   *   }
   * }]
   * @apiSuccessExample {JSON} Group:
   * {
   *  "id":1016,
   *  "groupname":"group name"
   * }
   * @apiUse V1ResponseError
   */
  app.get(
    apiUrl,
    [
      auth.authenticateUser,
      middleware.viewMode(),
      query("onlyActive").optional().isBoolean().toBoolean()
    ],
    middleware.requestWrapper(async (request, response) => {
      const onlyActiveDevices = request.query.onlyActive !== false;
      const devices = await models.Device.allForUser(
        request.user,
        onlyActiveDevices,
        request.body.viewAsSuperAdmin
      );
      return responseUtil.send(response, {
        devices: devices,
        statusCode: 200,
        messages: ["Completed get devices query."]
      });
    })
  );

  /**
   * @api {get} /api/v1/devices/:deviceName/in-group/:groupIdOrName Get a single device
   * @apiName GetDeviceInGroup
   * @apiGroup Device
   * @apiParam {string} deviceName Name of the device
   * @apiParam {stringOrInt} groupIdOrName Identifier of group device belongs to
   *
   * @apiDescription Returns details of the device if the user can access it either through
   * group membership or direct assignment to the device.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {JSON} device Device details
   *
   * @apiSuccessExample {JSON} device:
   * {
   * "id":2008,
   * "deviceName":"device name",
   * "groupName":"group name",
   * "userIsAdmin":true,
   * "users":Array[]
   * }
   * @apiSuccessExample {JSON} users:
   * [{
   * "userName"=>"user name",
   * "admin"=>false,
   * "id"=>123
   * }]
   * @apiUse V1ResponseError
   */
  app.get(
    `${apiUrl}/:deviceName/in-group/:groupIdOrName`,
    [
      auth.authenticateUser,
      middleware.getGroupByNameOrIdDynamic(param, "groupIdOrName"),
      middleware.isValidName(param, "deviceName")
    ],
    middleware.requestWrapper(async (request, response) => {
      const device = await models.Device.findOne({
        where: {
          devicename: request.params.deviceName,
          GroupId: request.body.group.id
        },
        include: [
          {
            model: models.User,
            attributes: ["id", "username"]
          }
        ]
      });

      let deviceReturn: any = {};
      if (device) {
        const accessLevel = await device.getAccessLevel(request.user);
        if (accessLevel < AccessLevel.Read) {
          throw new AuthorizationError(
            "User is not authorized to access device"
          );
        }

        deviceReturn = {
          id: device.id,
          deviceName: device.devicename,
          groupName: request.body.group.groupname,
          userIsAdmin: accessLevel == AccessLevel.Admin
        };
        if (accessLevel == AccessLevel.Admin) {
          deviceReturn.users = device.Users.map((user) => {
            return {
              userName: user.username,
              admin: user.DeviceUsers.admin,
              id: user.DeviceUsers.UserId
            };
          });
        }
      }
      return responseUtil.send(response, {
        statusCode: 200,
        device: deviceReturn,
        messages: ["Request succesful"]
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
   * device.  `relation` indicates whether the user is a `group` or `device` member.
   * @apiSuccessExample {JSON} rows:
   * [{
   * "id":1564,
   * "username":"user name",
   * "email":"email@server.nz",
   * "relation":"device",
   * "admin":true
   * }]
   *
   * @apiUse V1ResponseError
   */
  app.get(
    `${apiUrl}/users`,
    [
      auth.authenticateUser,
      middleware.getDeviceById(query),
      auth.userCanAccessDevices
    ],
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
   * user accounts to monitor a device without being part of the group that the
   * device belongs to.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {Number} deviceId ID of the device.
   * @apiParam {String} username Name of the user to add to the device.
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
   * authenticated by an admin user from the group that the device belongs to or an
   * admin user of the device.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {String} username name of the user to delete from the device.
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
   * @apiSuccess {String} token JWT string to provide to further API requests
   * @apiSuccess {int} id id of device reregistered
   * @apiUse V1ResponseSuccess
   * @apiUse V1ResponseError
   */
  app.post(
    `${apiUrl}/reregister`,
    [
      auth.authenticateDevice,
      middleware.getGroupByName(body, "newGroup"),
      middleware.isValidName(body, "newName"),
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
   * @apiDescription This call is to query all devices by groupname and/or groupname & devicename.
   * Both acitve and inactive devices are returned.
   *
   * @apiUse V1DeviceAuthorizationHeader
   *
   * @apiParam {JSON} [devices] array of Devices. Either groups or devices (or both) must be supplied.
   * @apiParamExample {JSON} devices:
   * [{
   *   "devicename":"newdevice",
   *   "groupname":"newgroup"
   * }]
   * @apiParam {String[]} [groups] array of group names. Either groups or devices (or both) must be supplied.
   * @apiParam {String} [operator] to use when user supplies both groups and devices. Default is `"or"`.
   * Accepted values are `"and"` or `"or"`.
   * @apiSuccess {JSON} devices Array of devices which match fully (group or group and devicename)
   * @apiSuccessExample {JSON} devices:
   * [{
   *  "groupname":"group name",
   *  "devicename":"device name",
   *  "id":2008,
   *  "saltId":1007,
   *  "Group.groupname":"group name"
   * }]
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
   * @apiParam {String} [from] ISO8601 date string
   * @apiParam {String} [window-size] length of rolling window in hours.  Default is 2160 (90 days)
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
   * @apiParam {String} [from] ISO8601 date string
   * @apiParam {Integer} [window-size] length of window in hours going backwards in time from the `from` param.  Default is 2160 (90 days)
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
