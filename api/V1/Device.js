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

const models = require("../../models");
const responseUtil = require("./responseUtil");
const middleware = require("../middleware");
const auth = require("../auth");
const { query, body } = require("express-validator/check");

module.exports = function(app, baseUrl) {
  const apiUrl = baseUrl + "/devices";

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
      if (!(await models.Device.freeDevicename(request.body.devicename))) {
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
    [auth.authenticateUser],
    middleware.requestWrapper(async (request, response) => {
      const devices = await models.Device.allForUser(request.user);
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
    apiUrl + "/users",
    [auth.authenticateUser, middleware.getDeviceById(query)],
    middleware.requestWrapper(async (request, response) => {
      let users = await request.body.device.users(request.user);

      users = users.map(u => {
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
    apiUrl + "/users",
    [
      auth.authenticateUser,
      middleware.getUserByNameOrId(body),
      middleware.getDeviceById(body),
      body("admin").isIn([true, false])
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
    apiUrl + "/users",
    [
      auth.authenticateUser,
      middleware.getDeviceById(body),
      middleware.getUserByNameOrId(body)
    ],
    middleware.requestWrapper(async function(request, response) {
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
   * @api {post} /api/v1/devices/rename Change the name and group of a device.
   * @apiName RenameDevice
   * @apiGroup Device
   * @apiDescription This call can change the name and the group of a device.
   *
   * @apiUse V1DeviceAuthorizationHeader
   *
   * @apiParam {String} newName new name of the device.
   * @apiParam {String} newGroup name of the group you want to move the device to.
   *
   * @apiUse V1ResponseSuccess
   * @apiUse V1ResponseError
   */
  app.post(
    apiUrl + "/rename",
    [
      auth.authenticateDevice,
      middleware.getGroupByName(body, "newGroup"),
      middleware.checkNewName("newName")
    ],
    middleware.requestWrapper(async function(request, response) {
      await request.device.rename(request.body.newName, request.body.group);

      return responseUtil.send(response, {
        statusCode: 200,
        devicename: request.body.newName,
        groupname: request.body.group.groupname,
        messages: ["name and group set"]
      });
    })
  );
};
