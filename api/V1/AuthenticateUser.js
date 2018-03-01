const jwt          = require('jsonwebtoken');
const config       = require('../../config/config');
const responseUtil = require('./responseUtil');
const middleware   = require('../middleware');
const { body }     = require('express-validator/check');


module.exports = function(app) {
  /**
  * @api {post} /authenticate_user/ Authenticate a user
  * @apiName AuthenticateUser
  * @apiGroup Authentication
  * @apiDescription Checks the username corresponds to an existing user account
  * and the password matches the account.
  *
  * @apiParam {String} username Username identifying a valid user account
  * @apiParam {String} password Password for the user account
  *
  * @apiSuccess {String} token JWT string to provide to further API requests
  */
  app.post(
    '/authenticate_user',
    [
      middleware.getUserByName,
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
          success: true,
          messages: ["Successful login."],
          token: 'JWT ' + jwt.sign(data, config.server.passportSecret),
          userData: userData
        });
      } else {
        return responseUtil.send(response, {
          statusCode: 401,
          success: false,
          messages: ["Wrong password or username."]
        });
      }
    })
  );
};
