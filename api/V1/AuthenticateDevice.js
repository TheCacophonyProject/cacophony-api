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

const jwt          = require('jsonwebtoken');
var config         = require('../../config');
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
          messages: ["Successful login."],
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
