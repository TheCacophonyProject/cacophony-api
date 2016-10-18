var models = require('../../models');
var util = require('./util');
var jwt = require('jsonwebtoken');
var config = require('../../config');
var passport = require('passport');
require('../../passportConfig')(passport);

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/users'
  app.post(apiUrl, function(req, res) {
    console.log(req.body);
    if (!req.body.username || req.body.username == 'undefined' ||
      !req.body.password || req.body.password == 'undefined') {
      return util.handleResponse(res, {
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
      .then(function(user) { // Created new User'user', .
        //console.log('user', user);
        // TODO add JWT for the user.
        var data = user.getJwtDataValues();
        util.handleResponse(res, {
          statusCode: 200,
          success: true,
          messages: ['Created new user.'],
          token: 'JWT ' + jwt.sign(data, config.passport.secret)
        });
      })
      .catch(function(err) { // Error with creating user.
        util.serverErrorResponse(res, err);
      });
  });

  app.get(apiUrl, passport.authenticate('jwt', { session: false }), function(req, res) {
    console.log(req.user);
    if (!req.user) {
      return util.handleResponse(res, {
        success: false,
        statusCode: 400,
        messages: ['JWT auth failed.']
      })
    }

    models.User.findOne({ where: { id: req.user.id } })
      .then(function(user) {
        return util.handleResponse(res, {
          success: true,
          statusCode: 200,
          messages: ['Successful request.'],
          userData: user.getDataValues()
        })
      })
      .catch(function(err) {
        util.serverErrorResponse(res, err);
      })
  })
}
