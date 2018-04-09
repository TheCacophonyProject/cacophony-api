const middleware = require('../middleware');
const models = require('../../models');
const util = require('./util');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/audiorecordings';

  /**
  * @api {post} /api/v1/audiorecordings/ Add a new audio recording
  * @apiName PostAudioRecording
  * @apiGroup AudioRecordings
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
      middleware.authenticateDevice,
    ],
    middleware.requestWrapper(async (req, res) => {
      return util.addRecordingFromPost(models.AudioRecording, req, res);
    })
  );


  /**
  * @api {put} /api/v1/audiorecordings/:id Update the metadata for an existing audio recording
  * @apiName UpdateAudioRecording
  * @apiGroup AudioRecordings
  * @apiDescription This call is used to update the metadata for a previously
  * uploaded audio recording. It takes a `data` field which may contain any of the following fields:
  * - recordingDateTime
  * - recordingTime
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
      middleware.authenticateUser,
    ],
    middleware.requestWrapper(async (req, res) => {
      return util.updateDataFromPut(models.AudioRecording, req, res);
    })
  );

  /**
  * @api {delete} /api/v1/audiorecordings/:id Delete an existing audio recording
  * @apiName DeleteAudioRecording
  * @apiGroup AudioRecordings
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
    ],
    middleware.requestWrapper(async (req, res) => {
      return util.deleteDataPoint(models.AudioRecording, req, res);
    })
  );

  /**
  * @api {get} /api/v1/audiorecordings/ Query available audio recordings
  * @apiName GetAudioRecordings
  * @apiGroup AudioRecordings
  *
  * @apiUse V1UserAuthorizationHeader
  *
  * @apiHeader {String} where [Sequelize where conditions](http://docs.sequelizejs.com/manual/tutorial/querying.html#where) for query
  * @apiHeader {Number} offset Query result offset (for paging).
  * @apiHeader {Number} limit Query result limit (for paging).
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
      middleware.authenticateUser,
    ],
    middleware.requestWrapper(async (req, res) => {
      return util.getRecordingsFromModel(models.AudioRecording, req, res);
    })
  );

  /**
  * @api {get} /api/v1/audiorecordings/:id Obtain token for retrieving audio recording
  * @apiName GetAudioRecording
  * @apiGroup AudioRecordings
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
      middleware.authenticateUser,
    ],
    middleware.requestWrapper(async (req, res) => {
      return util.getRecordingFile(models.AudioRecording, req, res);
    })
  );
};
