const models       = require('../../models');
const jwt          = require('jsonwebtoken');
const config       = require('../../config/config');
const responseUtil = require('./responseUtil');
const middleware   = require('../middleware');
const { check }    = require('express-validator/check');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/devices';

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
   *
   * @apiUse V1ResponseError
   */
  app.post(
    apiUrl,
    [
      middleware.checkNewName('devicename')
        .custom(value => { return models.Device.freeDevicename(value); }),
      middleware.checkNewPassword('password'),
      middleware.getGroup,
    ],
    middleware.requestWrapper(async (request, response) => {
      const device = await models.Device.create({
        devicename: request.body.devicename,
        password: request.body.password,
        GroupId: request.body.group.id,
      });
      const data = device.getJwtDataValues();
      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: ["Created new device."],
        token: 'JWT ' + jwt.sign(data, config.server.passportSecret)
      });
    })
  );

  /**
   * @api {get} /api/v1/devices Get list of devices
   * @apiName GetDevices
   * @apiGroup Device
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiUse V1ResponseSuccess
   *
   * @apiUse V1ResponseError
   */
  app.get(
    apiUrl,
    [ middleware.authenticateUser ],
    middleware.requestWrapper(async (request, response) => {
      var devices = await models.Device.allForUser(request.user);
      return responseUtil.send(response, {
        devices: devices,
        statusCode: 200,
        success: true,
        messages: ["completed get devices query"],
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
  * @apiParam {Number} userId ID of the user to add to the device.
  * @apiParam {Boolean} admin If true, the user should have administrator access to the device..
  *
  * @apiUse V1ResponseSuccess
  * @apiUse V1ResponseError
  */
  app.post(
    apiUrl + '/users',
    [
      middleware.authenticateUser,
      middleware.getDevice,
      middleware.getUser,
      check('admin').isIn([true, false]),
    ],
    middleware.requestWrapper(async (request, response) => {
      var added = await models.Device.addUserToDevice(
        request.user,
        request.body.device.id,
        request.body.user.id,
        request.body.admin,
      );

      if (added) {
        return responseUtil.send(response, {
          statusCode: 200,
          success: true,
          messages: ['Added user to device'],
        });
      } else {
        return responseUtil.send(response, {
          statusCode: 400,
          success: false,
          messages: ['failed to add user to device']
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
  * @apiParam {Number} userId ID of the user to delete from the device.
  * @apiParam {Number} deviceId ID of the device.
  *
  * @apiUse V1ResponseSuccess
  * @apiUse V1ResponseError
  */
  app.delete(
    apiUrl + '/users',
    [
      middleware.authenticateUser,
      middleware.getUser,
      middleware.getDevice,
    ],
    middleware.requestWrapper(async function(request, response) {
      var removed = await models.Device.removeUserFromDevice(
        request.user,
        request.body.device.id,
        request.body.user.id,
      );

      if (removed) {
        return responseUtil.send(response, {
          statusCode: 200,
          success: true,
          messages: ['Removed user from the device'],
        });
      } else {
        return responseUtil.send(response, {
          statusCode: 400,
          success: false,
          messages: ['Failed to remove user from the device'],
        });
      }
    })
  );
};
