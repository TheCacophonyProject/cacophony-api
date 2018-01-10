var models = require('../../models');
var jwt = require('jsonwebtoken');
var config = require('../../config/config');
var responseUtil = require('./responseUtil');
var passport = require('passport');
var log = require('../../logging');
var requestUtil = require('./requestUtil');

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
  app.post(apiUrl, function(req, res) {
    // Check that required data is given.
    if (!req.body.devicename || !req.body.password || !req.body.group) {
      return responseUtil.send(res, {
        statusCode: 400,
        success: false,
        messages: ['Missing devicename or password or group.']
      });
    }

    // Checks that devicename is free, group exists, creates device
    // then responds with a device JWT.
    models.Device.freeDevicename(req.body.devicename)
      .then(function(result) {
        if (!result) {  // Throw error if devicename is allready used.
          var err = new Error('Devicename in use.');
          err.invalidRequest = true;
          throw err;
        }
        return models.Group.getIdFromName(req.body.group); // Promise is rejected if no group with given name.
      })
      .then(function(groupId) {
        if (!groupId) {  //Throw error if the group doesn't exist.
          var err = new Error("Can't find group with given name: " + req.body.group);
          err.invalidRequest = true;
          throw err;
        }
        return models.Device.create({ // Create new device.
          devicename: req.body.devicename,
          password: req.body.password,
          GroupId: groupId
        });
      })
      .then(function(device) { // Created new Device.
        var data = device.getJwtDataValues();
        responseUtil.send(res, {
          statusCode: 200,
          success: true,
          messages: ["Created new device."],
          token: 'JWT ' + jwt.sign(data, config.server.passportSecret)
        });
      })
      .catch(function(err) { // Error with creating Device.
        if (err.invalidRequest) {
          return responseUtil.send(res, {
            statusCode: 400,
            success: false,
            messages: [err.message]
          });
        } else {
          responseUtil.serverError(res, err);
        }
      });
  });

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
    passport.authenticate(['jwt'], {session: false}),
    async (request, response) => {
      log.info(request.method + " Request: " + request.url);

      // Check that the request was authenticated by a User.
      if (!requestUtil.isFromAUser(request)) {
        return responseUtil.notFromAUser(response);
      }

      var devices = await models.Device.allForUser(request.user);

      return responseUtil.send(response, {
        devices: devices,
        statusCode: 200,
        success: true,
        messages: ["completed get devices query"],
      });
    }
  );

  /**
  * @api {post} /api/v1/devices/users Add a user to a device.
  * @apiName AddUserToDevice
  * @apiGroup Device
  * @apiDescription This call can add a user to a device. This is so individuals
  * can monitor there devices without being part of the group that the device
  * belongs to.
  *
  * @apiUse V1UserAuthorizationHeader
  *
  * @apiParam {Number} deviceId ID of the device.
  * @apiParam {Number} userId ID of the user to add to the device.
  * @apiParam {Boolean} admin If the user should be an admin for the device.
  *
  * @apiUse V1ResponseSuccess
  * @apiUse V1ResponseError
  */
  app.post(
    apiUrl + '/users',
    passport.authenticate(['jwt'], { session: false }),
    async function(request, response) {
      log.info(request.method + ' Request: ' + request.url);

      if (!requestUtil.isFromAUser(request)) {
        return responseUtil.notFromAUser(response);
      }

      var added = await models.Device.addUserToDevice(
        request.user,
        request.body.deviceId,
        request.body.userId,
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
    }
  );

  /**
  * @api {delete} /api/v1/devices/users Removes a user from a device.
  * @apiName RemoveUserFromDevice
  * @apiGroup Device
  * @apiDescription This call can remove a user from a deive. Has to be
  * authenticated by an admin from the group that the device belongs to or a
  * user that has contorl of device.
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
    passport.authenticate(['jwt'], { session: false }),
    async function(request, response) {
      log.info(request.method + ' Request: ' + request.url);

      if (!requestUtil.isFromAUser(request)) {
        return responseUtil.notFromAUser(response);
      }

      var removed = await models.Device.removeUserFromDevice(
        request.user,
        request.body.deviceId,
        request.body.userId,
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
    }
  );
};
