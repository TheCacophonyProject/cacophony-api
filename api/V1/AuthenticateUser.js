var models = require('../../models');
var jwt = require('jsonwebtoken');
var config = require('../../config/config');
var util = require('./util');
var responseUtil = require('./responseUtil');

module.exports = function(app) {
  app.post('/authenticate_user', function(req, res) {
    var username = req.body.username;
    models.User.findOne({ where: { username: username } })
      .then(function(user) {
        // Return 400 if username is not found.
        if (!user) {
          return util.handleResponse(res, {
            statusCode: 400,
            success: false,
            messages: ["No user found with given username"]
          });
        }

        // Compare password.
        user.comparePassword(req.body.password)
          .then(function(passwordMatch) {
            // Password is valid, send JWT and user data values in response.
            if (passwordMatch) {
              user.getDataValues()
              .then(function(userData) {
                var data = user.getJwtDataValues();
                data._type = 'user';
                return util.handleResponse(res, {
                  statusCode: 200,
                  success: true,
                  messages: ["Successfull login."],
                  token: 'JWT ' + jwt.sign(data, config.passport.secret),
                  userData: userData
                });
              });
            } else {
              return util.handleResponse(res, {
                statusCode: 401,
                success: false,
                messages: ["Wrong password or username."]
              });
            }
          });
      })
      .catch(function(err) {
        responseUtil.serverError(res, err);
      });
  });
};
