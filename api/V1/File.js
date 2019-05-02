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

const models            = require('../../models');
const util              = require('./util');
const responseUtil      = require('./responseUtil');
const config            = require('../../config');
const jsonwebtoken      = require('jsonwebtoken');
const middleware        = require('../middleware');
const auth              = require('../auth');
const { query, param }  = require('express-validator/check');


module.exports = (app, baseUrl) => {
  var apiUrl = baseUrl + '/files';

  /**
   * @api {post} /api/v1/files Adds a new file.
   * @apiName PostUserFile
   * @apiGroup Files
   * @apiDescription This call is used for upload a file, eg an audio bait file.
   * is required:
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {JSON} data Metadata about the recording in JSON format.  It must include the field 'type' (eg. audioBait).
   * @apiParam {File} file File of the recording.
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {Number} recordingId ID of the recording.
   * @apiuse V1ResponseError
   */
  app.post(
    apiUrl,
    [
      auth.authenticateUser,
    ],
    middleware.requestWrapper(
      util.multipartUpload((request, data, key) => {
        var dbRecord = models.File.build(data, {
          fields: models.File.apiSettableFields,
        });
        dbRecord.set('UserId', request.user.id);
        dbRecord.set('fileKey', key);
        return dbRecord;
      })
    )
  );

  /**
   * @api {get} /api/v1/files Query available files
   * @apiName QueryFiles
   * @apiGroup Files
   *
   * @apiHeader {String} Authorization Signed JSON web token for a user or device.
   *
   * @apiUse QueryParams
   *
   * @apiUse V1ResponseSuccessQuery
   */
  app.get(
    apiUrl,
    [
      auth.authenticateUser,
      middleware.parseJSON('where', query),
      query('offset').isInt().optional(),
      query('limit').isInt().optional(),
      middleware.parseJSON('order', query).optional(),
    ],
    middleware.requestWrapper(async (request, response) => {

      if (request.query.offset == null) {
        request.query.offset = '0';
      }

      if (request.query.offset == null) {
        request.query.limit = '100';
      }

      var result = await models.File.query(
        request.query.where,
        request.query.offset,
        request.query.limit,
        request.query.order);

      return responseUtil.send(response, {
        statusCode: 200,
        messages: ["Completed query."],
        limit: request.query.limit,
        offset: request.query.offset,
        count: result.count,
        rows: result.rows,
      });
    })
  );

  /**
   * @api {get} /api/v1/files/id Get a file
   * @apiName GetFile
   * @apiGroup Files
   * @apiUse MetaDataAndJWT
   *
   * @apiHeader {String} Authorization Signed JSON web token for either a user or a device.
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {String} jwt JSON Web Token to use to download the
   * recording file.
   * @apiSuccess {JSON} file Metadata for the file.
   *
   * @apiUse V1ResponseError
   */
  app.get(
    apiUrl + '/:id',
    [
      auth.authenticateAny,
      middleware.getFileById(param),
    ],
    middleware.requestWrapper(async (request, response) => {

      var file = request.body.file;

      var downloadFileData = {
        _type: 'fileDownload',
        key: file.fileKey,
      };

      return responseUtil.send(response, {
        statusCode: 200,
        messages: [],
        file: file,
        jwt: jsonwebtoken.sign(
          downloadFileData,
          config.server.passportSecret,
          { expiresIn: 60 * 10 }
        ),
      });
    })
  );

  /**
  * @api {delete} /api/v1/files/:id Delete an existing files
  * @apiName DeleteFile
  * @apiGroup Files
  * @apiDescription This call deletes a file.  The user making the
  * call must have uploaded the file or be an administrator.
  *
  * [/api/v1/signedUrl API](#api-SignedUrl-GetFile).
  *
  * @apiUse V1UserAuthorizationHeader
  *
  * @apiUse V1ResponseSuccess
  * @apiUse V1ResponseError
  */
  app.delete(
    apiUrl + '/:id',
    [
      auth.authenticateUser,
      middleware.getFileById(param),
    ],
    middleware.requestWrapper(async (request, response) => {
      await models.File.deleteIfAllowedElseThrow(request.user, request.body.file);
      responseUtil.send(response, {
        statusCode: 200,
        messages: ["Deleted file."],
      });
    })
  );
};
