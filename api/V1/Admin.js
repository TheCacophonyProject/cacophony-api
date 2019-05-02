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

const middleware   = require('../middleware');
const auth         = require('../auth');
const models       = require('../../models');
const responseUtil = require('./responseUtil');
const { param, body } = require('express-validator/check');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/admin';

  /**
   * @api {patch} /api/v1/admin/global_permission/:username Update user global permissions
   * @apiName UpdateGlobalPermission
   * @apiGroup Admin
   *
   * @apiParam {String} permission Users new global permission.
   * @apiUse V1ResponseSuccess
   *
   * @apiUse V1ResponseError
   */
  app.patch(
    apiUrl+'/global_permission/:username',
    [
      auth.authenticateAdmin,
      middleware.getUserByName(param),
      body('permission').isIn(models.User.GLOBAL_PERMISSIONS),
    ],
    middleware.requestWrapper(async (request, response) => {
      await models.User.changeGlobalPermission(
        request.admin, request.body.user, request.body.permission
      );
      responseUtil.send(response, {
        statusCode: 200,
        messages: ['Users global permission updated.'],
      });
    })
  );
};
