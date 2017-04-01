var config = require('../../config');
var util = require('./util');
var log = require('../../logging');
var passport = require('passport');
var config = require('../../config');
var AWS = require('aws-sdk');
var responseUtil = require('./responseUtil');
var fs = require('fs');
var stream = require('stream');

module.exports = function(app, baseUrl) {

  app.get(
    baseUrl + '/signedUrl',
    passport.authenticate(['jwt'], { session: false }),
    function(request, response) {

      // Check that the JWT is for a file download.
      if (request.user._type !== 'fileDownload') {
        return responseUtil.send(response, {
          statusCode: 400,
          success: false,
          messages: ["JWT was not a 'fileDownload' token..."]
        });
      }

      var mimeType = request.user.mimeType || "";
      var filename = request.user.filename || "file";

      var key = request.user.key;

      var s3 = new AWS.S3({
        endpoint: config.s3.endpoint,
        accessKeyId: config.s3.publicKey,
        secretAccessKey: config.s3.privateKey,
      });

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

    });
};
