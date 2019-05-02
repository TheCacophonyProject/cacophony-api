/*
cacophony-api: The Cacophony Project API server
Copyright (C) 2018  The Cacophony Project

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const models       = require('../../models');
const responseUtil = require('./responseUtil');
const middleware   = require('../middleware');
const auth         = require('../auth');
const { query, body } = require('express-validator/check');

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
      auth.authenticateUser,
      middleware.checkNewName('groupname')
        .custom(value => { return models.Group.freeGroupname(value); }),
    ],
    middleware.requestWrapper(async (request, response) => {

      const newGroup = await models.Group.create({groupname: request.body.groupname});
      await newGroup.addUser(request.user.id, {through: {admin: true}});
      return responseUtil.send(response, {
        statusCode: 200,
        messages: ['Created new group.']
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
      auth.authenticateUser,
      middleware.parseJSON('where', query),
    ],
    middleware.requestWrapper(async (request, response) => {

      var groups = await models.Group.query(request.query.where, request.user);
      return responseUtil.send(response, {
        statusCode: 200,
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
  * by an admin from the group or a user with global write permission. It can also be used to update the
  * admin status of a user for the group by setting admin to true or false.
  *
  * @apiUse V1UserAuthorizationHeader
  *
  * @apiParam {Number} group name of the group.
  * @apiParam {Number} username name of the user to add to the grouop.
  * @apiParam {Boolean} admin If the user should be an admin for the group.
  *
  * @apiUse V1ResponseSuccess
  * @apiUse V1ResponseError
  */
  app.post(
    apiUrl + '/users',
    [
      auth.authenticateUser,
      middleware.getGroupByNameOrId(body),
      middleware.getUserByNameOrId(body),
      body('admin').isBoolean(),
    ],
    middleware.requestWrapper(async (request, response) => {

      await models.Group.addUserToGroup(
        request.user,
        request.body.group,
        request.body.user,
        request.body.admin,
      );
      return responseUtil.send(response, {
        statusCode: 200,
        messages: ['Added user to group.'],
      });
    })
  );

  /**
  * @api {delete} /api/v1/groups/users Removes a user from a group.
  * @apiName RemoveUserFromGroup
  * @apiGroup Group
  * @apiDescription This call can remove a user from a group. Has to be authenticated
  * by an admin from the group or a user with global write permission.
  *
  * @apiUse V1UserAuthorizationHeader
  *
  * @apiParam {Number} group name of the group.
  * @apiParam {Number} username username of user to remove from the grouop.
  *
  * @apiUse V1ResponseSuccess
  * @apiUse V1ResponseError
  */
  app.delete(
    apiUrl + '/users',
    [
      auth.authenticateUser,
      middleware.getUserByNameOrId(body),
      middleware.getGroupByNameOrId(body),
    ],
    middleware.requestWrapper(async (request, response) => {
      await models.Group.removeUserFromGroup(
        request.user,
        request.body.group,
        request.body.user,
      );
      return responseUtil.send(response, {
        statusCode: 200,
        messages: ['Removed user from the group.'],
      });
    })
  );
};
