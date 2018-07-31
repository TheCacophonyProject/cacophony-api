const mime             = require('mime');
const { query, check } = require('express-validator/check');

const models            = require('../../models');
const responseUtil      = require('./responseUtil');
const util              = require('./util');
const config            = require('../../config');
const jsonwebtoken      = require('jsonwebtoken');
const middleware        = require('../middleware');


module.exports = (app, baseUrl) => {
  var apiUrl = baseUrl + '/recordings';

  const downloadRecording = util.multipartDownload('recording', (request, data, key) => {
    var recording = models.Recording.build(data, {
      fields: models.Recording.apiSettableFields,
    });
    recording.set('rawFileKey', key);
    recording.set('rawMimeType', guessRawMimeType(data.type, data.filename));
    recording.set('DeviceId', request.device.id);
    recording.set('GroupId', request.device.GroupId);
    recording.set('processingState', models.Recording.processingStates[data.type][0]);
    if (typeof request.device.public === 'boolean') {
      recording.set('public', request.device.public);
    }
    return recording;
  });

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
      downloadRecording
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
      middleware.getDeviceByName,
    ],
    middleware.requestWrapper(async (request, response) => {
      var device = request.body["device"];
      try {
        await request.user.checkUserControlsDevices([device.id])
      }
      catch (error) {
        if (error.name == 'UnauthorizedDeviceException') {
          return responseUtil.send(response, {
            statusCode: 400,
            success: false,
            messages: [error.message]
          });
        } else {
          throw error;
        }
      }

      request["device"] = device
      await downloadRecording(request, response)
    })
  );

  /**
   * @api {get} /api/v1/recordings Query available recordings
   * @apiName GetRecordigns
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
   *
   * @apiUse V1ResponseSuccessQuery
   *
   * @apiUse V1ResponseError
   */

  app.get(
    apiUrl,
    [
      middleware.authenticateUser,
      middleware.parseJSON('where'),
      query('offset').isInt(),
      query('limit').isInt(),
      middleware.parseJSON('order').optional(),
      middleware.parseArray('tags').optional(),
      query('tagMode')
        .optional()
        .custom(value => { return models.Recording.isValidTagMode(value); }),
    ],
    middleware.requestWrapper(async (request, response) => {

      if (request.query.tagMode == null) {
        request.query.tagMode = 'any';
      }

      delete request.query.where._tagged; // remove legacy tag mode selector (if included)

      var result = await models.Recording.query(
        request.user,
        request.query.where,
        request.query.tagMode,
        request.query.tags,
        request.query.offset,
        request.query.limit,
        request.query.order);

      return responseUtil.send(response, {
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
      check('id').isInt(),
    ],
    middleware.requestWrapper(async (request, response) => {

      var recording = await models.Recording.getOne(request.user, request.params.id);

      var downloadFileData = {
        _type: 'fileDownload',
        key: recording.fileKey,
        filename: recording.getFileName(),
        mimeType: recording.fileMimeType,
      };

      var downloadRawData = null;
      if (recording.canGetRaw()) {
        downloadRawData = {
          _type: 'fileDownload',
          key: recording.rawFileKey,
          filename: recording.getRawFileName(),
          mimeType: recording.rawMimeType,
        };
      }
      delete recording.rawFileKey;

      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: [],
        recording: recording,
        downloadFileJWT: jsonwebtoken.sign(
          downloadFileData,
          config.server.passportSecret,
          { expiresIn: 60 * 10 }
        ),
        downloadRawJWT: jsonwebtoken.sign(
          downloadRawData,
          config.server.passportSecret,
          { expiresIn: 60 * 10 }
        ),
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
      check('id').isInt(),
    ],
    middleware.requestWrapper(async (request, response) => {

      var deleted = await models.Recording.deleteOne(request.user, request.params.id);
      if (deleted) {
        responseUtil.send(response, {
          statusCode: 200,
          success: true,
          messages: ["Deleted recording."],
        });
      } else {
        responseUtil.send(response, {
          statusCode: 400,
          success: false,
          messages: ["Failed to delete recording."],
        });
      }
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
      check('id').isInt(),
      middleware.parseJSON('updates'),
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

function guessRawMimeType(type, filename) {
  var mimeType = mime.getType(filename);
  if (mimeType) {
    return mimeType;
  }
  switch (type) {
  case "thermalRaw":
    return "application/x-cptv";
  case "audio":
    return "audio/mpeg";
  default:
    return "application/octet-stream";
  }
}
