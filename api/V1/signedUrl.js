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

const stream          = require('stream');

const config          = require('../../config');
const log             = require('../../logging');
const middleware      = require('../middleware');
const auth            = require('../auth');
const modelsUtil      = require('../../models/util/util');
const responseUtil    = require('./responseUtil');
const { ClientError } = require('../customErrors');


module.exports = function(app, baseUrl) {

  /**
   * @api {get} /api/v1/signedUrl Get a file using a JWT
   * @apiName GetFile
   * @apiGroup SignedUrl
   *
   * @apiDescription Gets a file using a JWT as a method of authentication.
   *
   * @apiHeader {String} Authorization JWT for the content to retrieve. Must start with "JWT ".
   *
   * @apiSuccess {file} file Raw data stream of the file.
   *
   * @apiUse V1ResponseError
   */

  app.get(
    baseUrl + '/signedUrl',
    [
      auth.signedUrl,
    ],
    middleware.requestWrapper(async (request, response) => {

      var mimeType = request.jwtDecoded.mimeType || "";
      var filename = request.jwtDecoded.filename || "file";

      var key = request.jwtDecoded.key;
      if (!key) {
        throw new ClientError("No key provided.");
      }

      var s3 = modelsUtil.openS3();
      var params = {
        Bucket: config.s3.bucket,
        Key: key,
      };

      s3.getObject(params, function(err, data) {
        if (err) {
          log.error("Error with s3 getObject.");
          log.error(err.stack);
          return responseUtil.serverError(response, err);
        }

        if (!request.headers.range) {
          response.setHeader('Content-disposition',
            'attachment; filename=' + filename);
          response.setHeader('Content-type', mimeType);
          response.write(data.Body, 'binary');
          return response.end(null, 'binary');
        }

        var range = request.headers.range;
        var positions = range.replace(/bytes=/, "").split("-");
        var start = parseInt(positions[0], 10);
        var total = data.Body.length;
        var end = positions[1] ?
          parseInt(positions[1], 10) :
          total - 1;
        var chunksize = (end - start) + 1;

        var headers = {
          'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
          'Content-Length': chunksize,
          'Accept-Ranges': 'bytes',
          'Content-type': mimeType,
        };

        response.writeHead(206, headers);

        var bufStream = new stream.PassThrough();
        var b2 = data.Body.slice(start, end + 1);
        bufStream.end(b2);
        bufStream.pipe(response);
      });

    })
  );
};
