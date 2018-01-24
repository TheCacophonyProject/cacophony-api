var models = require('../../models');
var util = require('./util');
var jwt = require('jsonwebtoken');
var config = require('../../config/config');
var passport = require('passport');
var responseUtil = require('./responseUtil');
require('../../passportConfig')(passport);
const middleware = require('../middleware');

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
    middleware.logging,
    middleware.parseParams({
      body: {
        username: { type: 'STRING' },
        password: { type: 'STRING' },
      },
    }),
    middleware.validateAsyncWrapper(async (request, response) => {

      console.log(request.parsed);
      // TODO check that username is not already used.
      const user = await models.User.create({
        username: request.parsed.body.username,
        password: request.parsed.body.password,
      });

      const data = user.getJwtDataValues();

      responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: ['Created a new user'],
        token: 'JWT ' + jwt.sign(data, config.server.passportSecret),
      });



      /*
        .then(function(user) { // Created new User
          var data = user.getJwtDataValues();
          user.getDataValues()
            .then(function(userData) {
              responseUtil.send(response, {
                statusCode: 200,
                success: true,
                messages: ['Created new user.'],
                token: 'JWT ' + jwt.sign(data, config.server.passportSecret),
                userData: userData
              });
            });
        })
        .catch(function(err) { // Error with creating user.
          responseUtil.serverError(request, err);
        });
        */
    })
  );

  /**
   * @api {get} api/v1/user Get user data
   * @apiName GetUser
   * @apiGroup User
   *
   * @apiDescription A user can use the JWT to get updates on there user data.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiSuccess {JSON} userData Metadata about the user.
   * @apiUse V1ResponseSuccess
   *
   * @apiUse V1ResponseError
   */
  app.get(apiUrl, passport.authenticate('jwt', { session: false }), function(req, res) {
    if (!req.user) {
      return responseUtil.send(res, {
        success: false,
        statusCode: 400,
        messages: ['JWT auth failed.']
      });
    }

    models.User.findOne({ where: { id: req.user.id } })
      .then(function(user) {
        return user.getDataValues();
      })
      .then(function(userData) {
        return responseUtil.send(res, {
          success: true,
          statusCode: 200,
          messages: ['Successful request.'],
          userData: userData
        });
      })
      .catch(function(err) {
        responseUtil.serverError(res, err);
      });
  });
};
