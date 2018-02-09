const models       = require('../../models');
const responseUtil = require('./responseUtil');
const middleware   = require('../middleware');
const { check }    = require('express-validator/check');

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
  app.post(
    apiUrl,
    [
      middleware.authenticateUser,
      middleware.checkNewName('groupname')
        .custom(value => { return models.Group.freeGroupname(value); }),
    ],
    middleware.requestWrapper(async (request, response) => {

      const newGroup = await models.Group.create({groupname: request.body.groupname});
      await newGroup.addUser(request.user.id, {admin: true});
      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: ['created new group']
      });
    })
  );

  /**
   * @api {get} /api/v1/groups Get groups
   * @apiName GetGroups
   * @apiGroup Group
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {JSON} where [Sequelize where conditions](http://docs.sequelizejs.com/manual/tutorial/querying.html#where) for query.
   *
   * @apiUse V1ResponseSuccess
   *
   * @apiUse V1ResponseError
   */
  app.get(
    apiUrl,
    [
      middleware.authenticateUser,
      middleware.parseJSON('where')
    ],
    middleware.requestWrapper(async (request, response) => {

      var groups = await models.Group.query(request.query.where, request.user);
      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: [],
        groups: groups,
      });
    })
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
    [
      middleware.authenticateUser,
      middleware.getGroup,
      middleware.getUser,
      check('admin').isBoolean(),
    ],
    middleware.requestWrapper(async (request, response) => {

      var added = await models.Group.addUserToGroup(
        request.user,
        request.body.group.id,
        request.body.user.id,
        request.body.admin,
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
    })
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
    [
      middleware.authenticateUser,
      middleware.getUser,
      middleware.getGroup,
    ],
    middleware.requestWrapper(async (request, response) => {

      var removed = await models.Group.removeUserFromGroup(
        request.user,
        request.body.group.id,
        request.body.user.id,
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
    })
  );
};
