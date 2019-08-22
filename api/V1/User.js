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
const { body, param } = require("express-validator/check");
const { matchedData } = require("express-validator/filter");
const { ClientError } = require("../customErrors");

module.exports = function(app, baseUrl) {
  const apiUrl = baseUrl + "/users";

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
      middleware.checkNewName("username").custom(value => {
        return models.User.freeUsername(value);
      }),
      body("email")
        .isEmail()
        .custom(value => {
          return models.User.freeEmail(value);
        }),
      middleware.checkNewPassword("password")
    ],
    middleware.requestWrapper(async (request, response) => {
      const user = await models.User.create({
        username: request.body.username,
        password: request.body.password,
        email: request.body.email
      });

      const userData = await user.getDataValues();

      return responseUtil.send(response, {
        statusCode: 200,
        messages: ["Created new user."],
        token: "JWT " + auth.createEntityJWT(user),
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
   * @apiParam {String} [username] New username to set.
   * @apiParam {String} [password] New password to set.
   * @apiParam {String} [email] New email to set.
   *
   * @apiUse V1ResponseSuccess
   * @apiUse V1ResponseError
   */
  app.patch(
    apiUrl,
    [
      auth.authenticateUser,
      (req, _, next) => {
        // Deprecated, legacy support until consumers migrated see #199 on GitHub
        if (typeof req.body.data === "string") {
          try {
            const json = JSON.parse(req.body.data);
            req.body.email = json.email;
            req.body.username = json.username;
            req.body.password = json.password;
          } catch (e) {
            throw new ClientError("Could not parse JSON in data field.");
          }
        }
        next();
      },
      middleware
        .checkNewName("username")
        .custom(value => {
          return models.User.freeUsername(value);
        })
        .optional(),
      body("email")
        .isEmail()
        .custom(value => {
          return models.User.freeEmail(value);
        })
        .optional(),
      middleware.checkNewPassword("password").optional()
    ],
    middleware.requestWrapper(async (request, response) => {
      const validData = matchedData(request);
      if (Object.keys(validData).length === 0) {
        throw new ClientError(
          "Must provide at least one of: username; email; password."
        );
      }
      const user = request.user;
      await user.update(validData, { fields: user.apiSettableFields });
      responseUtil.send(response, {
        statusCode: 200,
        messages: ["Updated user."]
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
    [auth.authenticateUser, middleware.getUserByName(param)],
    middleware.requestWrapper(async (request, response) => {
      return responseUtil.send(response, {
        statusCode: 200,
        messages: [],
        userData: await request.body.user.getDataValues()
      });
    })
  );
};
