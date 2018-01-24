var models = require('../../models');
var util = require('./util');
var jwt = require('jsonwebtoken');
var config = require('../../config/config');
var responseUtil = require('./responseUtil');
var passport = require('passport');
var log = require('../../logging');
var requestUtil = require('./requestUtil');
const middleware = require('../middleware');
const { check, oneOf, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/devices';

  /**
   * @api {post} /api/v1/devices Register a new device
   * @apiName RegisterDevice
   * @apiGroup Device
   *
   * @apiParam {String} devicename Unique device name.
   * @apiParam {String} password Password for the device.
   * @apiParam {String} [group] Group to assign the device to. Need this or groupId
   * @apiParam {Number} [groupId] Group`to assign to.
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {String} token JWT for authentication. Contains the device ID and type.
   *
   * @apiUse V1ResponseError
   */
  app.post(
    apiUrl,
    [
      check('devicename')
        .isLength({ min: 8 })
        .matches(/^[a-zA-Z0-9]+(?:[_ -]?[a-zA-Z0-9])*$/)
        .custom(value => { return models.Device.freeDevicename(value); }),
      check('password')
        .isLength({ min: 8 })
        .matches(/^[a-zA-Z0-9]+(?:[_ -]?[a-zA-Z0-9])*$/),
      oneOf([
        check('group').custom((...args) => {
          return models.Group.getFromParam(...args);
        }),
        check('groupId').custom((...args) => {
          return models.Group.getFromParam(...args);
        }),
      ])
    ],
    middleware.validateAsyncWrapper(async function(req, res) {

      var device = await models.Device.create({
        devicename: req.body.devicename,
        password: req.body.password,
        GroupId: req.body.group.id,
      });

      return responseUtil.send(res, {
        statusCode: 200,
        success: true,
        messages: ["Created new device."],
        token: 'JWT ' + jwt.sign(device.getJwtDataValues(), config.server.passportSecret)
      });
    })
  );

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
    apiUrl, [
      check('Authorization').custom((...args) => {
        return util.authenticate('user', ...args);
      })
    ],
    middleware.validateAsyncWrapper(async (request, response) => {
      log.info(request.method + " Request: " + request.url);

      var devices = await models.Device.allForUser(request.user);

      return responseUtil.send(response, {
        devices: devices,
        statusCode: 200,
        success: true,
        messages: ["completed get devices query"],
      });
    })
  );
};
