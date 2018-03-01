const jwt          = require('jsonwebtoken');
const config       = require('../../config/config');
const responseUtil = require('./responseUtil');
const middleware   = require('../middleware');
const { body }     = require('express-validator/check');

module.exports = function(app) {
  /**
  * @api {post} /authenticate_device/ Authenticate a device
  * @apiName AuthenticateDevice
  * @apiGroup Authentication
  * @apiDescription Checks the username corresponds to an existing device account
  * and the password matches the account.
  *
  * @apiParam {String} devicename The name identifying a valid device account
  * @apiParam {String} password Password for the device account
  *
  * @apiSuccess {String} token JWT string to provide to further API requests
  */
  app.post(
    '/authenticate_device',
    [
      middleware.getDeviceByName,
      body('password').exists(),
    ],
    middleware.requestWrapper(async (request, response) => {

      const passwordMatch = await request.body.device.comparePassword(request.body.password);
      if (passwordMatch) {
        var data = request.body.device.getJwtDataValues();
        var token = 'JWT ' + jwt.sign(data, config.server.passportSecret);
        return responseUtil.send(response, {
          statusCode: 200,
          success: true,
          messages: ["Successfull login."],
          token: token
        });
      } else {
        return responseUtil.send(response, {
          statusCode: 401,
          success: false,
          messages: ["Wrong password or devicename."]
        });
      }
    })
  );
};
