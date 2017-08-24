var models = require('../../models');
var util = require('./util');
var jwt = require('jsonwebtoken');
var config = require('../../config/config');
var passport = require('passport');
var responseUtil = require('./responseUtil');
require('../../passportConfig')(passport);

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/users';
  app.post(apiUrl, function(req, res) {
    if (!req.body.username || req.body.username == 'undefined' ||
      !req.body.password || req.body.password == 'undefined') {
      return responseUtil.send(res, {
        statusCode: 400,
        success: false,
        messages: ['Missing username or password.']
      });
    }

    // TODO check that username is not allready used.
    models.User.create({
        username: req.body.username,
        password: req.body.password
      })
      .then(function(user) { // Created new User
        var data = user.getJwtDataValues();
        user.getDataValues()
          .then(function(userData) {
            responseUtil.send(res, {
              statusCode: 200,
              success: true,
              messages: ['Created new user.'],
              token: 'JWT ' + jwt.sign(data, config.passport.secret),
              userData: userData
            });
          });
      })
      .catch(function(err) { // Error with creating user.
        responseUtil.serverError(res, err);
      });
  });

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
