const models       = require('../../models');
const jwt          = require('jsonwebtoken');
const config       = require('../../config/config');
const responseUtil = require('./responseUtil');
const middleware   = require('../middleware');
const check        = require('express-validator/check');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/users';

  /**
   * @api {post} /api/v1/users Register a new user
   * @apiName RegisterUser
   * @apiGroup User
   *
   * @apiParam {String} username Username for new user.
   * @apiParam {String} password Password for new user.
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
      middleware.checkNewPassword('password'),
    ],
    middleware.requestWrapper(async (request, response) => {

      var user = await models.User.create({
        username: request.body.username,
        password: request.body.password,
      });

      var jwtData = user.getJwtDataValues();
      var userData = await user.getDataValues();

      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: ['Created new user.'],
        token: 'JWT ' + jwt.sign(jwtData, config.server.passportSecret),
        userData: userData
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
      middleware.authenticateUser,
      check.param("username").exists(),
    ],
    middleware.requestWrapper(async (request, response) => {
      var user = await models.User.getFromName(request.params.username);
      if (user === null) {
        return responseUtil.send(response, {
          statusCode: 400,
          success: false,
          messages: ["no such user"],
        });
      }
      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: [],
        userData: await user.getDataValues(),
      });
    })
  );
};
