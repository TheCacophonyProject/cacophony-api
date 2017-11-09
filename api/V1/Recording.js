var models = require('../../models');
var util = require('./util');
var passport = require('passport');
var log = require('../../logging');
var tagsUtil = require('./tagsUtil');
var requestUtil = require('./requestUtil');
var responseUtil = require('./responseUtil');
var multiparty = require('multiparty');
var config = require('../../config/config')
var AWS = require('aws-sdk');
var uuidv4 = require('uuid/v4');
var jsonwebtoken = require('jsonwebtoken');
var sequelize = require('sequelize');

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
    passport.authenticate(['jwt'], { session: false }),
    async (request, response) => {
      log.info(request.method + " Request: " + request.url);

      // Check that the request was authenticated by a device.
      if (!requestUtil.isFromADevice(request))
        return responseUtil.notFromADevice(response);
      var device = request.user;

      var recording;
      var key = uuidv4();
      var form = new multiparty.Form();
      var validData = false;
      var uploadProcess = null;
      var uploadStarted = false;
      var invalidMessages = [];

      // Make new Recording from the data field and Device.
      // TODO Stop stream if 'data' is invalid.
      form.on('field', (name, value) => {
        if (name != 'data') return; // Only parse data field.
        try {
          var data = JSON.parse(value);
          recording = models.Recording.build(data, {
            fields: models.Recording.apiSettableFields,
          });
          recording.set('rawFileKey', key);
          recording.set('DeviceId', device.id);
          recording.set('GroupId', device.GroupId);
          recording.set('processingState',
            models.Recording.processingStates[data.type][0]);
          if (typeof device.public === 'boolean')
            recording.set('public', device.public);
          validData = true;
        } catch (e) {
          log.debug(e);
          // TODO Stop stream here.
        }
      });

      // Stream file to LeoFS.
      form.on('part', (part) => {
        if (part.name != 'file') return part.resume();
        uploadStarted = true;
        log.debug('Streaming file to LeoFS.')
        uploadPromise = new Promise(function(resolve, reject) {
          var s3 = new AWS.S3({
            endpoint: config.leoFS.endpoint,
            accessKeyId: config.leoFS.publicKey,
            secretAccessKey: config.leoFS.privateKey,
          });
          s3.upload({
            Bucket: config.leoFS.bucket,
            Key: key,
            Body: part,
          }, (err, data) => {
            if (err) return reject(err);
            log.info("Finished streaming file to LeoFS Key:", key);
            resolve();
          });
        });
      });

      // Close response.
      form.on('close', async () => {
        log.info("Finished POST request.");
        if (!validData || !uploadStarted)
          return responseUtil.invalidDatapointUpload(response);

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
      })

      form.parse(request);
    });

  /**
   * @api {get} /api/v1/recordings Query available recordings
   * @apiName GetRecordigns
   * @apiGroup Recordings
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {JSON} where [Sequelize where conditions](http://docs.sequelizejs.com/manual/tutorial/querying.html#where) for query
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
    passport.authenticate(['jwt'], { session: false }),
    async (request, response) => {
      log.info(request.method + " Request: " + request.url);

      // Check that the request was authenticated by a User.
      if (!requestUtil.isFromAUser(request))
        return responseUtil.notFromAUser(response);

      var where = request.query.where;
      var offset = parseInt(request.query.offset);
      var limit = parseInt(request.query.limit);
      var order = request.query.order;

      // Validate 'where', 'offset', and 'limit'
      var errorMessages = [];
      try {
        where = JSON.parse(where);
      } catch (e) {
        errorMessages.push("'where' field was not a valid JSON.")
      }
      if (isNaN(offset)) errorMessages.push("'offset' was not a number.")
      if (isNaN(limit)) errorMessages.push("'limit' was not a number.")
      if (order != null) {
        try {
          order = JSON.parse(order);
        } catch (e) {
          errorMessages.push("'order' was not a valid JSON.")
        }
      } else {
        order = [
          // Sort by recordingDatetime but handle the case of the
          // timestamp being missing and fallback to sorting by id.
          [sequelize.fn("COALESCE", sequelize.col('recordingDateTime'), '1970-01-01'), "DESC"],
          ["id", "DESC"],
        ];
      }
      if (errorMessages.length > 0) {
        return responseUtil.send(response, {
          statusCode: 400,
          success: false,
          messages: errorMessages,
        });
      }

      // Make sequelize query.
      var userGroupIds = await request.user.getGroupsIds();
      var query = {
        where: {
          "$and": [
            where, // User query
            { "$or": [{ public: true }, { GroupId: { "$in": userGroupIds } }] }
          ],
        },
        order: order,
        include: [
          { model: models.Group },
          { model: models.Tag },
          { model: models.Device, where: {}, attributes: ["devicename", "id"] },
        ],
        limit: limit,
        offset: offset,
        attributes: models.Recording.userGetAttributes,
      };
      // Query database.
      var result = await models.Recording.findAndCount(query);

      // Send response
      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: ["Completed query."],
        limit: limit,
        offset: offset,
        count: result.count,
        rows: result.rows,
      });
    });

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
      passport.authenticate(['jwt'], { session: false }),
      async (request, response) => {
        log.info(request.method + " Request: " + request.url);

        // Check that the request was authenticated by a User.
        if (!requestUtil.isFromAUser(request))
          return responseUtil.notFromAUser(response);

        var id = parseInt(request.params.id);
        if (!id)
          return responseUtil.invalidDataId(response);

        // Make sequelize query.
        var userGroupIds = await request.user.getGroupsIds();
        var query = {
          where: {
            "$and": [
              { id: id },
              { "$or": [{ public: true }, { GroupId: { "$in": userGroupIds } }] }
            ],
          },
          include: [
            { model: models.Tag, },
            { model: models.Device, where: {}, attributes: ["devicename", "id"] },
          ],
          attributes: models.Recording.userGetAttributes.concat(['rawFileKey']),
        };

        // Query database.
        var recording = await models.Recording.findOne(query);

        downloadFileData = {
          _type: 'fileDownload',
          key: recording.fileKey,
          filename: recording.getFileName(),
          mimeType: recording.fileMimeType,
        }

        downloadRawData = null;
        if (recording.canGetRaw()) {
          downloadRawData = {
            _type: 'fileDownload',
            key: recording.rawFileKey,
            filename: "rawData",
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
      }
    );
};
