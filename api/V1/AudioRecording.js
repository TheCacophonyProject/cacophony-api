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

const { param, header, body }  = require('express-validator/check');
const moment = require('moment');
const { format } = require('util');

const middleware = require('../middleware');
const auth       = require('../auth');
const models = require('../../models');
const recordingUtil = require('./recordingUtil');
const responseUtil = require('./responseUtil');


module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/audiorecordings';


  // Massage fields sent to the legacy AudioRecordings API so that
  // they work in the Recordings schema.
  const mungeAudioData = function(data) {
    data.type = 'audio';
    return data;
  };

  /**
  * @api {post} /api/v1/audiorecordings/ Add a new audio recording
  * @apiName PostAudioRecording
  * @apiGroup AudioRecordings
  * @apiDeprecated use now (#Recordings:PostRecording)
  * @apiDescription This call is used to upload new audio recording. It takes a
  * `data` field which contains JSON object string that may contain any of the
  * following fields:
  * - recordingDateTime
  * - recordingTime
  * - size
  * - duration
  * - location
  * - additionalMetadata
  * - batteryLevel
  * - batteryCharging
  * - airplaneModeOn
  * - relativeToDawn
  * - relativeToDusk
  * - version
  *
  * @apiUse V1DeviceAuthorizationHeader
  *
  * @apiParam {JSON} data Metadata about the recording (see above).
  *
  * @apiUse V1ResponseSuccess
  * @apiUse V1ResponseError
  */
  app.post(
    apiUrl,
    [
      auth.authenticateDevice,
    ],
    middleware.requestWrapper(
      recordingUtil.makeUploadHandler(mungeAudioData)
    )
  );

  /**
  * @api {put} /api/v1/audiorecordings/:id Update the metadata for an existing audio recording
  * @apiName UpdateAudioRecording
  * @apiGroup AudioRecordings
  * @apiDeprecated use now (#Recordings:UpdateRecording)
  * @apiDescription This call is used to update the metadata for a previously
  * uploaded audio recording. It takes a `data` field which may contain any of the following fields:
  * - location
  * - additionalMetadata
  *
  * @apiUse V1UserAuthorizationHeader
  *
  * @apiParam {JSON} data Metadata about the recording (see above).
  *
  * @apiUse V1ResponseSuccess
  * @apiUse V1ResponseError
  */
  app.put(
    apiUrl + "/:id",
    [
      auth.authenticateUser,
      param('id').isInt(),
      middleware.parseJSON('data', body),
    ],
    middleware.requestWrapper(async (request, response) => {
      var updated = await models.Recording.updateOne(
        request.user, request.params.id, request.body.data);

      if (updated) {
        responseUtil.validDatapointUpdate(response);
      } else {
        responseUtil.invalidDatapointUpdate(response, 'Failed to update recordings.');
      }
    })
  );

  /**
  * @api {delete} /api/v1/audiorecordings/:id Delete an existing audio recording
  * @apiName DeleteAudioRecording
  * @apiGroup AudioRecordings
  * @apiDeprecated use now (#Recordings:DeleteRecording)
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
      param('id').isInt(),
    ],
    middleware.requestWrapper(async (request, response) => {
      await recordingUtil.delete_(request, response);
    })
  );

  /**
  * @api {get} /api/v1/audiorecordings/ Query available audio recordings
  * @apiName GetAudioRecordings
  * @apiGroup AudioRecordings
  * @apiDeprecated use now (#Recordings:QueryRecordings)
  *
  * @apiUse V1UserAuthorizationHeader
  *
  * @apiHeader {String} [where] [Sequelize where conditions](http://docs.sequelizejs.com/manual/tutorial/querying.html#where) for query
  * @apiHeader {Number} [offset] Query result offset (for paging).
  * @apiHeader {Number} [limit] Query result limit (for paging).
  *
  * @apiUse V1ResponseSuccess
  * @apiSuccess {Number} offset Mirrors request offset parameter.
  * @apiSuccess {Number} limit Mirrors request limit parameter.
  * @apiSuccess {Number} count Total number of records which match the query.
  * @apiSuccess {JSON} rows List of details for records which matched the query.
  *
  * @apiUse V1ResponseError
  */
  app.get(
    apiUrl,
    [
      auth.authenticateUser,
      middleware.parseJSON('where', header).optional(),
      header('offset').isInt().optional(),
      header('limit').isInt().optional(),
    ],
    middleware.requestWrapper(async (request, response) => {
      // recordingUtil.query expects these as query parameters not
      // headers so copy them across.
      request.query.where = request.headers.where;
      request.query.limit = request.headers.limit;
      request.query.offset = request.headers.offset;

      const qresult = await recordingUtil.query(request, "audio");
      var result = {
        rows: [],
        limit: request.query.limit,
        offset: request.query.offset,
        count: qresult.count,
      };

      // Just save the front end fields for each model.
      for (const row of qresult.rows) {
        result.rows.push(getFrontendFields(row));
      }
      responseUtil.validDatapointGet(response, result);
    })
  );

  const getFrontendFields = function(rec) {
    return {
      id: rec.id,
      recordingDateTime: rec.recordingDateTime,
      relativeToDawn: rec.relativeToDawn,
      relativeToDusk: rec.relativeToDusk,
      recordingTime: moment.parseZone(format("%o", rec.recordingDateTime)).format("HH:mm:ss"),
      duration: rec.duration,
      location: rec.location,
      fileKey: rec.fileKey,
      batteryCharging: rec.batteryCharging,
      batteryLevel: rec.batteryLevel,
      airplaneModeOn: rec.airplaneModeOn,
      version: rec.version,
      deviceId: rec.Device.id,
      groupId: rec.Group.id,
      group: rec.Group.groupname,
      additionalMetadata: rec.additionalMetadata,
    };
  };

  /**
  * @api {get} /api/v1/audiorecordings/:id Obtain token for retrieving audio recording
  * @apiName GetAudioRecording
  * @apiGroup AudioRecordings
  * @apiDeprecated use now (#Recordings:GetRecording)
  * @apiDescription This call returns a new JSON Web Token (JWT) which
  * can be used to retrieve a specific audio recording. This is should
  * be used with the [/api/v1/signedUrl API](#api-SignedUrl-GetFile).
  *
  * @apiUse V1UserAuthorizationHeader
  *
  * @apiUse V1ResponseSuccess
  * @apiSuccess {String} jwt JSON Web Token to use to actually retrieve the recording.
  *
  * @apiUse V1ResponseError
  */
  app.get(
    apiUrl + "/:id",
    [
      auth.authenticateUser,
      param('id').isInt(),
    ],
    middleware.requestWrapper(async (request, response) => {
      const { recording, cookedJWT } = await recordingUtil.get(request, "audio");
      responseUtil.send(response, {
        statusCode: 200,
        messages: [],
        recording: recording,
        jwt: cookedJWT,
      });
    })
  );
};
