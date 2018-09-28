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

const { query, param, body } = require('express-validator/check');

const middleware        = require('../middleware');
const models            = require('../../models');
const recordingUtil     = require('./recordingUtil');
const responseUtil      = require('./responseUtil');



module.exports = (app, baseUrl) => {
  var apiUrl = baseUrl + '/recordings';

  /**
   * @apiDefine RecordingParams
   *
   * @apiParam {JSON} data Metadata about the recording.   Valid tags are:
   * <ul>
   * <li>(REQUIRED) type: must be 'thermalRaw'
   * <li>duration
   * <li>recordingDateTime
   * <li>location
   * <li>version
   * <li>batteryCharging
   * <li>batteryLevel
   * <li>airplaneModeOn
   * <li>additionalMetadata
   * <li>comment
   * </ul>
   * @apiParam {File} file Recording file to upload
   */

  /**
   * @api {post} /api/v1/recordings Add a new recording.
   * @apiName PostRecording
   * @apiGroup Recordings
   * @apiDescription Uploads a device's own raw thermal video to the server.  It currently
   * supports raw thermal video but will eventually support all recording types.
   *
   * @apiUse V1DeviceAuthorizationHeader
   *
   * @apiUse RecordingParams
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {Number} recordingId ID of the recording.
   * @apiuse V1ResponseError
   */
  app.post(
    apiUrl,
    [
      middleware.authenticateDevice,
    ],
    middleware.requestWrapper(
      recordingUtil.makeUploadHandler()
    )
  );

  /**
   * @api {post} /api/v1/recordings/:devicename Add a new recording on behalf of device
   * @apiName PostRecordingOnBehalf
   * @apiGroup Recordings
   * @apiDescription Called by a user to upload raw thermal video on behalf of a device.
   * The user must have permission to view videos from the device or the call will return an
   * error.  It currently supports raw thermal video but will eventually support all
   * recording types.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiUse RecordingParams
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {Number} recordingId ID of the recording.
   * @apiuse V1ResponseError
   */
  app.post(
    apiUrl + "/:devicename",
    [
      middleware.authenticateUser,
      middleware.getDeviceByName(param),
    ],
    middleware.ifUsersDeviceRequestWrapper(
      recordingUtil.makeUploadHandler()
    )
  );

  /**
   * @api {get} /api/v1/recordings Query available recordings
   * @apiName QueryRecordings
   * @apiGroup Recordings
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiUse QueryParams
   * @apiParam {JSON} tags Only return recordings tagged with one or more of the listed tags (JSON array).
   * @apiParam {String} tagMode Only return recordings with specific types of tags. Valid values:
   * <ul>
   * <li>any: match recordings with any (or no) tag
   * <li>untagged: match only recordings with no tags
   * <li>tagged: match only recordings which have been tagged
   * <li>no-human: match only recordings which are untagged or have been automatically tagged
   * <li>automatic-only: match only recordings which have been automatically tagged
   * <li>human-only: match only recordings which have been manually tagged
   * <li>automatic+human: match only recordings which have been both automatically & manually tagged
   * </ul>
   * @apiParam {JSON} [filterOptions] options for filtering the recordings data.
   * <ul>
   * <li>latLongAcc: Maximum accuracy of latitude longitude coordinates in meters. Minimum 100m
   * </ul>
   *
   * @apiUse V1ResponseSuccessQuery
   *
   * @apiUse V1ResponseError
   */
  app.get(
    apiUrl,
    [
      middleware.authenticateUser,
      middleware.parseJSON('where', query),
      query('offset').isInt(),
      query('limit').isInt(),
      middleware.parseJSON('order', query).optional(),
      middleware.parseArray('tags', query).optional(),
      query('tagMode')
        .optional()
        .custom(value => { return models.Recording.isValidTagMode(value); }),
      middleware.parseJSON('filterOptions', query).optional(),
    ],
    middleware.requestWrapper(async (request, response) => {
      const result = await recordingUtil.query(request);
      responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: ["Completed query."],
        limit: request.query.limit,
        offset: request.query.offset,
        count: result.count,
        rows: result.rows,
      });
    })
  );

  /**
   * @api {get} /api/v1/recordings/:id Get a recording
   * @apiName GetRecording
   * @apiGroup Recordings
   *
   * @apiUse MetaDataAndJWT
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {String} downloadFileJWT JSON Web Token to use to download the
   * recording file.
   * @apiSuccess {String} downloadRawJWT JSON Web Token to use to download
   * the raw recording data.
   * @apiSuccess {JSON} recording The recording data.
   *
   * @apiUse V1ResponseError
   */
  app.get(
    apiUrl + '/:id',
    [
      middleware.authenticateUser,
      param('id').isInt(),
    ],
    middleware.requestWrapper(async (request, response) => {
      const { recording, rawJWT, cookedJWT } = await recordingUtil.get(request);
      responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: [],
        recording: recording,
        downloadFileJWT: cookedJWT,
        downloadRawJWT: rawJWT,
      });
    })
  );

  /**
  * @api {delete} /api/v1/recordings/:id Delete an existing recording
  * @apiName DeleteRecording
  * @apiGroup Recordings
  *
  * @apiUse V1UserAuthorizationHeader
  *
  * @apiUse V1ResponseSuccess
  * @apiUse V1ResponseError
  */
  app.delete(
    apiUrl + '/:id',
    [
      middleware.authenticateUser,
      param('id').isInt(),
    ],
    middleware.requestWrapper(async (request, response) => {
      return recordingUtil.delete_(request, response);
    })
  );

  /**
  * @api {patch} /api/v1/recordings/:id Update an existing recording
  * @apiName UpdateRecording
  * @apiGroup Recordings
  * @apiDescription This call is used for updating fields of a previously
  * submitted recording.
  *
  * The following fields that may be updated are:
  * - location
  * - comment
  * - additionalMetadata
  *
  * If a change to any other field is attempted the request will fail and no
  * update will occur.
  *
  * @apiUse V1UserAuthorizationHeader
  *
  * @apiParam {JSON} updates Object containing the fields to update and their new values.
  *
  * @apiUse V1ResponseSuccess
  * @apiUse V1ResponseError
  */
  app.patch(
    apiUrl + '/:id',
    [
      middleware.authenticateUser,
      param('id').isInt(),
      middleware.parseJSON('updates', body),
    ],
    middleware.requestWrapper(async (request, response) => {
      var updated = await models.Recording.updateOne(
        request.user, request.params.id, request.body.updates);

      if (updated) {
        return responseUtil.send(response, {
          statusCode: 200,
          success: true,
          messages: ['Updated recording.']
        });
      } else {
        return responseUtil.send(response, {
          statusCode: 400,
          success: false,
          messages: ['Failed to update recordings.'],
        });
      }
    })
  );
};
