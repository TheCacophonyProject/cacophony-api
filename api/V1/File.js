const models            = require('../../models');
const util              = require('./util');
const responseUtil      = require('./responseUtil');
const config            = require('../../config');
const jsonwebtoken      = require('jsonwebtoken');
const middleware        = require('../middleware');
const { query }  = require('express-validator/check');

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
    middleware.requestWrapper(
      util.multipartDownload('file', (request, data, key) => {
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
   * @api {get} /api/v1/files Get stored files
   * @apiName GetFiles
   * @apiGroup Files
   *
   * @apiHeader {String} Authorization Signed JSON web token for a user or device.
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
      middleware.authenticateIsFromSite,
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
