const models            = require('../../models');
const log               = require('../../logging');
const responseUtil      = require('./responseUtil');
const multiparty        = require('multiparty');
const config            = require('../../config/config');
const uuidv4            = require('uuid/v4');
const jsonwebtoken      = require('jsonwebtoken');
const modelsUtil        = require('../../models/util/util');
const middleware        = require('../middleware');
const { query, check }  = require('express-validator/check');

module.exports = (app, baseUrl) => {
  var apiUrl = baseUrl + '/recordings';

  /**
   * @api {post} /api/v1/recordings Add a new recording.
   * @apiName PostRecording
   * @apiGroup Recordings
   * @apiDescription This call is used for uploads of new recordings. It
   * currently supports raw thermal video but will eventually support all
   * recording types. It takes a 'data' field which contains a JSON object
   * string that can contain any of the following fields, Note that 'type'
   * is required:
   * - type: REQUIRED, one of ('thermalRaw')
   * - duration
   * - recordingDateTime
   * - location
   * - version
   * - batteryCharging
   * - batteryLevel
   * - airplaneModeOn
   * - additionalMetadata
   * - processingMeta
   *
   * @apiUse V1DeviceAuthorizationHeader
   *
   * @apiParam {JSON} data Metadata about the recording (see above).
   * @apiParam {File} file File of the recording.
   *
   * @apiUse V1ResponseSuccess
   * @apiuse V1ResponseError
   */
  app.post(
    apiUrl,
    [
      middleware.authenticateDevice,
    ],
    middleware.requestWrapper(async (request, response) => {

      var recording;
      var key = uuidv4();
      var form = new multiparty.Form();
      var validData = false;
      var uploadStarted = false;

      // Make new Recording from the data field and Device.
      // TODO Stop stream if 'data' is invalid.
      form.on('field', (name, value) => {
        if (name != 'data') {
          return; // Only parse data field.
        }
        try {
          var data = JSON.parse(value);
          recording = models.Recording.build(data, {
            fields: models.Recording.apiSettableFields,
          });
          recording.set('rawFileKey', key);
          recording.set('DeviceId', request.device.id);
          recording.set('GroupId', request.device.GroupId);
          recording.set('processingState',
            models.Recording.processingStates[data.type][0]);
          if (typeof request.device.public === 'boolean') {
            recording.set('public', request.device.public);
          }
          validData = true;
        } catch (e) {
          log.debug(e);
          // TODO Stop stream here.
        }
      });

      // Stream file to LeoFS.
      var uploadPromise;
      form.on('part', (part) => {
        if (part.name != 'file') {
          return part.resume();
        }
        uploadStarted = true;
        log.debug('Streaming file to LeoFS.');
        uploadPromise = new Promise(function(resolve, reject) {
          var s3 = modelsUtil.openS3();
          s3.upload({
            Bucket: config.s3.bucket,
            Key: key,
            Body: part,
          }, (err) => {
            if (err) {
              return reject(err);
            }
            log.info("Finished streaming file to LeoFS Key:", key);
            resolve();
          });
        });
      });

      // Close response.
      form.on('close', async () => {
        log.info("Finished POST request.");
        if (!validData || !uploadStarted) {
          return responseUtil.invalidDatapointUpload(response);
        }

        // Check that th file uploaded to LeoFS.
        try {
          await uploadPromise;
        } catch (e) {
          return responseUtil.send(response, {
            statusCode: 500,
            success: false,
            messages: ["Failed to upload file to LeoFS"],
          });
        }
        // Validate and upload recording
        await recording.validate();
        await recording.save();
        return responseUtil.validDatapointUpload(response);
      });

      form.on('error', (e) => {
        log.error(e);
        return responseUtil.send(response, {
          statusCode: 400,
          success: false,
          messages: ["failed to get recording"],
        });
      });

      form.parse(request);
    })
  );

  /**
   * @api {get} /api/v1/recordings Query available recordings
   * @apiName GetRecordigns
   * @apiGroup Recordings
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {JSON} where [Sequelize where conditions](http://docs.sequelizejs.com/manual/tutorial/querying.html#where) for query. Can also add key _tagged as true or false if you just want recordings that are or aren't tagged.
   * @apiParam {Number} offset Query result offset (for paging).
   * @apiParam {Number} limit Query result limit (for paging).
   * @apiParam {JSON} [order] [Sequelize ordering](http://docs.sequelizejs.com/manual/tutorial/querying.html#ordering). Exampel: [["recordingDateTime", "ASC"]]
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
   * @apiDescription This call returns metadata for a recording in JSON format
   * and a JSON Web Token (JWT) which can be used to retrieve the recorded
   * content. This is should be used with the
   * [/api/v1/signedUrl API](#api-SignedUrl-GetFile).
   *
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
          mimeType: null,
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
        request.user, request.params.id, request.query.updates);

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
