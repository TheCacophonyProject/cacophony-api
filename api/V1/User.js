var models = require('../../models');
var util = require('./util');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/user'

  app.post(apiUrl, function(req, res) {
    if (!req.body.username || !req.body.password) {
      return util.handleResponse(res, {
        statusCode: 400,
        success: false,
        messages: ['Missing username or password.']
      });
    }
    models.User.create({
        username: req.body.username,
        password: req.body.password
      })
      .then(function() { // Created new User.
        // TODO add JWT for the user.
        util.handleResponse(res, {
          statusCode: 200,
          success: true,
          messages: ['Created new user.']
        });
      })
      .catch(function(err) { // Error with creating user.
        util.serverErrorResponse(res, err);
      });
  });
}
