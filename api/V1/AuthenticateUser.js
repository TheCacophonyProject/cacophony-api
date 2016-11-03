var models = require('../../models');
var jwt = require('jsonwebtoken');
var config = require('../../config');
var util = require('./util');

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
              var data = user.getJwtDataValues();
              data._type = 'user';
              return util.handleResponse(res, {
                statusCode: 200,
                success: true,
                messages: ["Successfull login."],
                token: 'JWT ' + jwt.sign(data, config.passport.secret),
                userData: user.getDataValues()
              });
            } else {
              return util.handleResponse(res, {
                statusCode: 401,
                success: false,
                mesages: ["Wrong password or username."]
              });
            }
          });
      })
      .catch(function(err) {
        return util.serverErrorResponse(res, err);
      });
  });
};
