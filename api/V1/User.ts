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

import middleware from "../middleware";
import auth from "../auth";
import models from "../../models";
import responseUtil from "./responseUtil";
import { body, param } from "express-validator/check";
import { matchedData } from "express-validator/filter";
import { ClientError } from "../customErrors";
import { Application } from "express";
import config from "../../config";
import { User, UserStatic } from "../../models/User";
import AllModels from "../../models";

export default function (app: Application, baseUrl: string) {
  const apiUrl = `${baseUrl}/users`;

  /**
   * @api {post} /api/v1/users Register a new user
   * @apiName RegisterUser
   * @apiGroup User
   *
   * @apiParam {String} username Username for new user.
   * @apiParam {String} password Password for new user.
   * @apiParam {String} email Email for new user.
   * @apiParam {Integer} [endUserAgreement] Version of the end user agreement accepted.
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
      middleware.isValidName(body, "username").custom((value) => {
        return models.User.freeUsername(value);
      }),
      body("email")
        .isEmail()
        .custom((value) => {
          return models.User.freeEmail(value);
        }),
      middleware.checkNewPassword("password"),
      body("endUserAgreement").isInt().optional()
    ],
    middleware.requestWrapper(async (request, response) => {
      const user: User = await models.User.create({
        username: request.body.username,
        password: request.body.password,
        email: request.body.email,
        endUserAgreement: request.body.endUserAgreement
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
      middleware
        .isValidName(body, "username")
        .custom((value) => {
          return models.User.freeUsername(value);
        })
        .optional(),
      body("email")
        .isEmail()
        .custom((value) => {
          return models.User.freeEmail(value);
        })
        .optional(),
      middleware.checkNewPassword("password").optional(),
      body("endUserAgreement").isInt().optional()
    ],
    middleware.requestWrapper(async (request, response) => {
      const validData = matchedData(request);
      if (Object.keys(validData).length === 0) {
        throw new ClientError(
          "Must provide at least one of: username; email; password; endUserAgreement."
        );
      }
      const user: UserStatic = request.user;
      await user.update(validData, {
        where: {},
        fields: user.apiSettableFields as string[]
      });
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
    `${apiUrl}/:username`,
    [auth.authenticateUser, middleware.getUserByName(param)],
    middleware.requestWrapper(async (request, response) => {
      return responseUtil.send(response, {
        statusCode: 200,
        messages: [],
        userData: await request.body.user.getDataValues()
      });
    })
  );

  /**
   * @api {get} api/v1/listUsers List usernames
   * @apiName ListUsers
   * @apiGroup User
   * @apiDescription Given an authenticated super-user, we need to be able to get
   * a list of all usernames on the system, so that we can switch to viewing
   * as a given user.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiSuccess {JSON} usersList List of usernames
   * @apiUse V1ResponseSuccess
   *
   * @apiUse V1ResponseError
   */
  app.get(
    `${baseUrl}/listUsers`,
    [auth.authenticateAdmin],
    middleware.requestWrapper(async (request, response) => {
      const users = await AllModels.User.getAll({});
      return responseUtil.send(response, {
        statusCode: 200,
        messages: [],
        usersList: users
      });
    })
  );

  /**
   * @api {get} /api/v1/endUserAgreement/latest Get the latest end user agreement version
   * @apiName EndUserAgreementVersion
   * @apiGroup User
   *
   * @apiSuccess {Integer} euaVersion Version of the latest end user agreement.
   * @apiUse V1ResponseSuccess
   *
   * @apiUse V1ResponseError
   */
  app.get(
    baseUrl + "/endUserAgreement/latest",
    middleware.requestWrapper(async (request, response) => {
      return responseUtil.send(response, {
        statusCode: 200,
        messages: [],
        euaVersion: config.euaVersion
      });
    })
  );
}
