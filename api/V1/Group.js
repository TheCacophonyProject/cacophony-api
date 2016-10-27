var models = require('../../models');
var util = require('./util');
var jwt = require('jsonwebtoken');
var config = require('../../config');
var passport = require('passport');
require('../../passportConfig')(passport);

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/groups';

  app.post(apiUrl, passport.authenticate(['jwt'], { session: false }), function(req, res) {
    // Check that required data is given.
    if (!req.body.groupname) {
      return util.handleResponse(res, {
        statusCode: 400,
        success: false,
        messages: ['Missing groupname.']
      })
    }

    // Checks that groupname is free, creates group
    // then sets user as admin and group user.
    models.Group.getIdFromName(req.body.groupname)
      .then(function(groupId) {
        if (groupId) {  // Throw error if groupename is allready used.
          var err = new Error('Groupname in use.');
          err.invalidRequest = true;
          throw err;
        }
        return models.Group.create({ // Create new Group.
          groupname: req.body.groupname,
        })
      })
      .then(function(group) { // Created new Group.
        return group.addUser(req.user.id, {admin: true});
      })
      .then(function() {
        util.handleResponse(res, {
          statusCode: 200,
          success: true,
          messages: ['Created new group.']
        });
      })
      .catch(function(err) { // Error with creating Group.
        if (err.invalidRequest) {
          return util.handleResponse(res, {
            statusCode: 400,
            success: false,
            messages: [err.message]
          })
        } else {
          util.serverErrorResponse(res, err);
        }
      });
  });
}
