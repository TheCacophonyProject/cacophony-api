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

const { body, oneOf } = require("express-validator/check");

const auth = require("../auth");
const responseUtil = require("./responseUtil");
const middleware = require("../middleware");

const ttlTypes = Object.freeze({ short: 60, medium: 5 * 60, long: 30 * 60 });

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
    "/authenticate_user",
    [
      oneOf(
        [
          middleware.getUserByName(body),
          middleware.getUserByName(body, "nameOrEmail"),
          middleware.getUserByEmail(body),
          middleware.getUserByEmail(body, "nameOrEmail")
        ],
        "could not find a user with the given username or email"
      ),
      body("password").exists()
    ],
    middleware.requestWrapper(async (request, response) => {
      const passwordMatch = await request.body.user.comparePassword(
        request.body.password
      );
      if (passwordMatch) {
        const token = await auth.createEntityJWT(request.body.user);
        const userData = await request.body.user.getDataValues();
        responseUtil.send(response, {
          statusCode: 200,
          messages: ["Successful login."],
          token: "JWT " + token,
          userData: userData
        });
      } else {
        responseUtil.send(response, {
          statusCode: 401,
          messages: ["Wrong password or username."]
        });
      }
    })
  );

  /**
   * @api {post} /token Generate temporary JWT
   * @apiName Token
   * @apiGroup Authentication
   * @apiDescription It is sometimes necessary to include an
   * authentication token in a URL but it is not safe to provide a
   * user's primary JWT as it can easily leak into logs etc. This API
   * generates a short-lived token which can be used as part of URLs.
   *
   * @apiParam {String} ttl short,medium,long defining token expiry time
   * @apiParam {JSON} access dictionary of access to different entities
   *  e.g. {"devices":"r"}
   * @apiUse V1UserAuthorizationHeader
   * @apiSuccess {JSON} token JWT that may be used to call the report endpoint.
   */
  app.post(
    "/token",
    [body("ttl").optional(), body("access").optional(), auth.authenticateUser],
    middleware.requestWrapper(async (request, response) => {
      let expiry = ttlTypes[request.body.ttl];
      if (!expiry) {
        expiry = ttlTypes["medium"];
      }
      const token = auth.createEntityJWT(
        request.user,
        { expiresIn: expiry },
        request.body.access
      );

      responseUtil.send(response, {
        statusCode: 200,
        messages: ["Token generated."],
        token: token
      });
    })
  );
};
