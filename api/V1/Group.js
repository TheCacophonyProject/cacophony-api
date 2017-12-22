var models = require('../../models');
var util = require('./util');
var jwt = require('jsonwebtoken');
var config = require('../../config/config');
var passport = require('passport');
var responseUtil = require('./responseUtil');
require('../../passportConfig')(passport);
var log = require('../../logging');
var requestUtil = require('./requestUtil');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/groups';

  /**
   * @api {post} /api/v1/groups Create a new group
   * @apiName NewGroup
   * @apiGroup Group
   *
   * @apiDescription Creates a new group with the user used in the JWT as the admin.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {String} groupname Unique group name.
   *
   * @apiUse V1ResponseSuccess
   *
   * @apiUse V1ResponseError
   */
  app.post(apiUrl, passport.authenticate(['jwt'], { session: false }), function(req, res) {
    // Check that required data is given.
    if (!req.body.groupname) {
      return responseUtil.send(res, {
        statusCode: 400,
        success: false,
        messages: ['Missing groupname.']
      });
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
        });
      })
      .then(function(group) { // Created new Group.
        return group.addUser(req.user.id, {admin: true});
      })
      .then(function() {
        responseUtil.send(res, {
          statusCode: 200,
          success: true,
          messages: ['Created new group.']
        });
      })
      .catch(function(err) { // Error with creating Group.
        if (err.invalidRequest) {
          return responseUtil.send(res, {
            statusCode: 400,
            success: false,
            messages: [err.message]
          });
        } else {
          responseUtil.serverError(res, err);
        }
      });
  });

  /**
   * @api {get} /api/v1/groups Get groups
   * @apiName GetGroups
   * @apiGroup Group
   *
   * @apiParam {JSON} where [Sequelize where conditions](http://docs.sequelizejs.com/manual/tutorial/querying.html#where) for query.
   * @apiParam {Number} [userId] Only get groups that this user belongs to.
   *
   * @apiUse V1ResponseSuccess
   *
   * @apiUse V1ResponseError
   */
  app.get(
    apiUrl,
    async function(request, response) {
      log.info(request.method + ' Request: ' + request.url);

      var where = request.query.where;
      var queryUserId = request.query.userId;
      try {
        where = JSON.parse(where);
      } catch (e) {
        return responseUtil.send(response, {
          statusCode: 400,
          success: false,
          messages: ['Could not parse "where" to a JSON'],
        });
      }

      var groups = await models.Group.query(where, queryUserId);

      return responseUtil.send(response, {
        statusCode: 200,
        success: false,
        messages: [],
        groups: groups,
      });
    }
  );

  /**
  * @api {post} /api/v1/groups/users Add a user to a group.
  * @apiName AddUserToGroup
  * @apiGroup Group
  * @apiDescription This call can add a user to a group. Has to be authenticated
  * by an admin from the group or a superuser. It can also be used to update the
  * admin status of a user for the group by setting admin to true or false.
  *
  * @apiUse V1UserAuthorizationHeader
  *
  * @apiParam {Number} groupId ID of the group.
  * @apiParam {Number} userId ID of the user to add to the grouop.
  * @apiParam {Boolean} admin If the user should be an admin for the group.
  *
  * @apiUse V1ResponseSuccess
  * @apiUse V1ResponseError
  */
  app.post(
    apiUrl + '/users',
    passport.authenticate(['jwt'], { session: false }),
    async function (request, response) {
      log.info(request.method + ' Request: ' + request.url);

      if (!requestUtil.isFromAUser(request)) {
        return responseUtil.notFromAUser(response);
      }

      var added = await models.Group.addUserToGroup(
        request.user,
        request.body.groupId,
        request.body.userId,
        request.body.admin
      );

      if (added) {
        return responseUtil.send(response, {
          statusCode: 200,
          success: true,
          messages: ['Added user to group'],
        });
      } else {
        return responseUtil.send(response, {
          statusCode: 400,
          success: false,
          messages: ['Failed to add user to group'],
        });
      }
    }
  );

  /**
  * @api {delete} /api/v1/groups/users Removes a user from a group.
  * @apiName RemoveUserFromGroup
  * @apiGroup Group
  * @apiDescription This call can remove a user from a group. Has to be authenticated
  * by an admin from the group or a superuser.
  *
  * @apiUse V1UserAuthorizationHeader
  *
  * @apiParam {Number} groupId ID of the group.
  * @apiParam {Number} userId ID of the user to remove from the grouop.
  *
  * @apiUse V1ResponseSuccess
  * @apiUse V1ResponseError
  */
  app.delete(
    apiUrl + '/users',
    passport.authenticate(['jwt'], { session: false }),
    async function (request, response) {
      log.info(request.method + ' Request: ' + request.url);

      if (!requestUtil.isFromAUser(request)) {
        return responseUtil.notFromAUser(response);
      }

      var removed = await models.Group.removeUserFromGroup(
        request.user,
        request.body.groupId,
        request.body.userId,
      );

      if (removed) {
        return responseUtil.send(response, {
          statusCode: 200,
          success: true,
          messages: ['Removed user from the group'],
        });
      } else {
        return responseUtil.send(response, {
          statusCode: 400,
          success: false,
          messages: ['Failed to remove user from the group'],
        });
      }
    }
  );
};
