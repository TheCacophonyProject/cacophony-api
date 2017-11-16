var models = require('../../models');
var util = require('./util');
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
   * @apiGroup Devices
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {JSON} devices List of devices.
   *
   * @apiUse V1ResponseError
   */
  app.get(
      apiUrl,
      passport.authenticate(['jwt'], {session: false}),
      async (request, response) => {
          log.info(request.method + " Request: " + request.url);

          // Check that the request was authenticated by a User.
          if (!requestUtil.isFromAUser(request))
            return responseUtil.notFromAUser(response);

          var userGroupIds = await request.user.getGroupsIds();
          var devices = await models.Device.findAndCount({
              where: { GroupId: { "$in": userGroupIds } },
              attributes: ["devicename", "id"],
          });

          return responseUtil.send(response, {
              statusCode: 200,
              success: true,
              messages: ["completed get devices query"],
              devices: devices,
          })
      });
};
