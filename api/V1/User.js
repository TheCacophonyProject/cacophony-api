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

const models = require('../../models');
const jwt          = require('jsonwebtoken');
const config       = require('../../config');
const responseUtil = require('./responseUtil');
const middleware   = require('../middleware');
const auth         = require('../auth');
const { body, param } = require('express-validator/check');
const { ClientError } = require('../customErrors');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/users';

  /**
   * @api {post} /api/v1/users Register a new user
   * @apiName RegisterUser
   * @apiGroup User
   *
   * @apiParam {String} username Username for new user.
   * @apiParam {String} password Password for new user.
   * @apiParam {String} email Email for new user.
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {String} token JWT for authentication. Contains the user ID and type.
   * @apiSuccess {JSON} userData Metadata of the user.
   *
   * @apiUse V1ResponseError
   */
  app.post(
    apiUrl,
    [
      middleware.checkNewName('username')
        .custom(value => { return models.User.freeUsername(value); }),
      body('email').isEmail().withMessage("Invalid email")
        .custom(value => { return models.User.freeEmail(value); }),
      middleware.checkNewPassword('password'),
    ],
    middleware.requestWrapper(async (request, response) => {

      var user = await models.User.create({
        username: request.body.username,
        password: request.body.password,
        email: request.body.email,
      });

      var jwtData = user.getJwtDataValues();
      var userData = await user.getDataValues();

      return responseUtil.send(response, {
        statusCode: 200,
        messages: ['Created new user.'],
        token: 'JWT ' + jwt.sign(jwtData, config.server.passportSecret),
        userData: userData
      });
    })
  );

  /**
   * @api {patch} /api/v1/users Updates the authenticated user's details
   * @apiName UpdateUser
   * @apiGroup User
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {JSON} data Fields to update.
   *
   * @apiUse V1ResponseSuccess
   * @apiUse V1ResponseError
   */
  app.patch(
    apiUrl,
    [
      auth.authenticateUser,
      middleware.parseJSON('data', body),
    ],
    middleware.requestWrapper(async (request, response) => {
      const email = request.body.data.email;
      const user = request.user;
      if (email) {
        try {
          await models.User.freeEmail(email, user.id);
        } catch (e) {
          throw new ClientError('Error: ' + e.message);
        }
      }
      await user.update(request.body.data, { fields: user.apiSettableFields });
      responseUtil.send(response, {
        statusCode: 200,
        messages: ['Updated user.'],
      });
    })
  );

  /**
   * @api {get} api/v1/users/:username Get details for a user
   * @apiName GetUser
   * @apiGroup User
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiSuccess {JSON} userData Metadata of the user.
   * @apiUse V1ResponseSuccess
   *
   * @apiUse V1ResponseError
   */
  app.get(
    apiUrl + "/:username",
    [
      auth.authenticateUser,
      middleware.getUserByName(param),
    ],
    middleware.requestWrapper(async (request, response) => {
      return responseUtil.send(response, {
        statusCode: 200,
        messages: [],
        userData: await request.body.user.getDataValues(),
      });
    })
  );
};
