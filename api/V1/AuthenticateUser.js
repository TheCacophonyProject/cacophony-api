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

const jwt = require('jsonwebtoken');
const config = require('../../config');
const responseUtil = require('./responseUtil');
const middleware = require('../middleware');
const {
  body,
  oneOf
} = require('express-validator/check');


module.exports = function(app) {
  /**
   * @api {post} /authenticate_user/ Authenticate a user
   * @apiName AuthenticateUser
   * @apiGroup Authentication
   * @apiDescription Checks the username corresponds to an existing user account
   * and the password matches the account.
   * One of 'username', 'email', or 'nameOrEmail' is required.
   *
   * @apiParam {String} username Username identifying a valid user account
   * @apiParam {String} email Email identifying a valid user account
   * @apiParam {String} nameOrEmail Username or email of a valid user account.
   * @apiParam {String} password Password for the user account
   *
   * @apiSuccess {String} token JWT string to provide to further API requests
   */
  app.post(
    '/authenticate_user',
    [
      oneOf([
          middleware.getUserByName(body),
          middleware.getUserByName(body, 'nameOrEmail'),
          middleware.getUserByEmail(body),
          middleware.getUserByEmail(body, 'nameOrEmail'),
        ],
        "could not find a user with the given username or email"),
      body('password').exists(),
    ],
    middleware.requestWrapper(async (request, response) => {

      const passwordMatch = await request.body.user.comparePassword(request.body.password);
      if (passwordMatch) {
        const userData = await request.body.user.getDataValues();
        var data = request.body.user.getJwtDataValues();
        data._type = 'user';
        return responseUtil.send(response, {
          statusCode: 200,
          messages: ["Successful login."],
          token: 'JWT ' + jwt.sign(data, config.server.passportSecret),
          userData: userData
        });
      } else {
        return responseUtil.send(response, {
          statusCode: 401,
          messages: ["Wrong password or username."]
        });
      }
    })
  );
};