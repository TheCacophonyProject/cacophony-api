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

const { body } = require('express-validator/check');

const middleware = require('../middleware');
const auth       = require('../auth');
const models = require('../../models');
const recordingUtil = require('./recordingUtil');
const responseUtil = require('./responseUtil');
const log = require('../../logging');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/tags';

  /**
   * @api {post} /api/v1/tags Adds a new tag
   * @apiName AddTag
   * @apiGroup Tag
   *
   * @apiDescription This call is used to tag a recording. Only users that can
   * view a recording can tag it. It takes a `tag` field which contains a JSON
   * object string that may contain any of the following fields:
   * - animal
   * - confidence
   * - startTime
   * - duration
   * - number
   * - trapType
   * - trapInteractionTime
   * - trapInteractionDuration
   * - trappedTime
   * - killedTime
   * - poisionedTime
   * - sex
   * - age
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {Number} recordingId ID of the recording that you want to tag.
   * @apiparam {JSON} tag Tag data in JSON format.
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {Number} tagId ID of the tag just added.
   *
   * @apiuse V1ResponseError
   *
   */
  app.post(
    apiUrl,
    [
      auth.authenticateUser,
      middleware.parseJSON('tag', body),
      body('recordingId').isInt(),
    ],
    middleware.requestWrapper(async function(request, response) {
      await recordingUtil.addTag(request, response);
    })
  );

  // Delete a tag
  app.delete(
    apiUrl,
    [
      auth.authenticateUser,
      body('tagId').isInt(),
    ],
    middleware.requestWrapper(async function(request, response) {
      var tagDeleteResult = await models.Tag.deleteFromId(request.body.tagId, request.user);
      if (tagDeleteResult) {
        return responseUtil.send(response, {
          statusCode: 200,
          messages: ["Deleted tag."]
        });
      } else {
        return responseUtil.send(response, {
          statusCode: 400,
          messages: ["Failed to delete tag."]
        });
      }
    })
  );
};
