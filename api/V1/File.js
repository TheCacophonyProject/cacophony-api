const models            = require('../../models');
const log               = require('../../logging');
const responseUtil      = require('./responseUtil');
const multiparty        = require('multiparty');
const config            = require('../../config');
const uuidv4            = require('uuid/v4');
const jsonwebtoken      = require('jsonwebtoken');
const modelsUtil        = require('../../models/util/util');
const middleware        = require('../middleware');
const { query, check }  = require('express-validator/check');

module.exports = (app, baseUrl) => {
  var apiUrl = baseUrl + '/files';

  /**
   * @api {post} /api/v1/recordings Add a new recording.
   * @apiName PostUserFile
   * @apiGroup Files
   * @apiDescription This call is used for upload a file, eg an audio bait file.   It takes a 'data' field which contains a JSON object
   * string that can contain any of the following fields, Note that 'type'
   * is required:
   * - type: REQUIRED, one of ('audioBait')
   * -
   *
   * @apiUse V1DeviceAuthorizationHeader
   *
   * @apiParam {JSON} data Metadata about the recording (see above).
   * @apiParam {File} file File of the recording.
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {Number} recordingId ID of the recording.
   * @apiuse V1ResponseError
   */
  app.post(
    apiUrl,
    [
      middleware.authenticateUser,
    ],
    middleware.requestWrapper(async (request, response) => {

      var dbRecord;
      var key = uuidv4();
      var validData = false;
      var uploadStarted = false;

      var form = new multiparty.Form();
      // Make new userfile from the data field and Device.
      // TODO Stop stream if 'data' is invalid.
      form.on('field', (name, value) => {
        if (name != 'data') {
          return; // Only parse data field.
        }
        try {
          var data = JSON.parse(value);
          dbRecord = models.File.build(data, {
            fields: models.File.apiSettableFields,
          });
          dbRecord.set('fileKey', key);
          dbRecord.set('UserId', request.user.id);
          validData = true;
        } catch (e) {
          log.debug(e);
          // TODO Stop stream here.
        }
      });

      // Stream file to S3.
      var uploadPromise;
      form.on('part', (part) => {
        if (part.name != 'file') {
          return part.resume();
        }
        uploadStarted = true;
        log.debug('Streaming file to bucket.');
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
            log.info("Finished streaming file to object store key:", key);
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

        // Check that the file uploaded to file store.
        try {
          await uploadPromise;
        } catch (e) {
          return responseUtil.send(response, {
            statusCode: 500,
            success: false,
            messages: ["Failed to upload file to bucket"],
          });
        }
        // Validate and upload recording
        await dbRecord.validate();
        await dbRecord.save();
        return responseUtil.validRecordingUpload(response, dbRecord.id);
      });

      form.on('error', (e) => {
        log.error(e);
        return responseUtil.send(response, {
          statusCode: 400,
          success: false,
          messages: ["failed to get file content"],
        });
      });

      form.parse(request);
    })
  );

  /**
   * @api {get} /api/v1/files Get stored files
   * @apiName GetFiles
   * @apiGroup Files
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {JSON} where [Sequelize where conditions](http://docs.sequelizejs.com/manual/tutorial/querying.html#where) for query.
   * @apiParam {Number} offset Query result offset (for paging).
   * @apiParam {Number} limit Query result limit (for paging).
   * @apiParam {JSON} [order] [Sequelize ordering](http://docs.sequelizejs.com/manual/tutorial/querying.html#ordering). Example: [["recordingDateTime", "ASC"]]
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
      query('offset').isInt().optional(),
      query('limit').isInt().optional(),
      middleware.parseJSON('order').optional(),
    ],
    middleware.requestWrapper(async (request, response) => {

      if (request.query.offset == null) {
        request.query.offset = '0';
      }

      if (request.query.offset == null) {
        request.query.limit = '100';
      }

      var result = await models.Files.query(
        request.user,
        request.query.where,
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
   * @api {get} /api/v1/files/id Get a recording
   * @apiName GetFile
   * @apiGroup Files
   * @apiDescription This call returns metadata for a recording in JSON format
   * and a JSON Web Token (JWT) which can be used to retrieve the recorded
   * content. This is should be used with the
   * [/api/v1/signedUrl API](#api-SignedUrl-GetFile).
   *
   * @apiHeader {String} Authorization Signed JSON web token for a user or device.
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
      middleware.authenticateIsFromSite,
      middleware.getFileById,
    ],
    middleware.requestWrapper(async (request, response) => {

      var file = await models.File.findById(request.params.id);

      var downloadFileData = {
        _type: 'fileDownload',
        key: file.fileKey,
        // filename: file.getFileName(),
      };

      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
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
 };
