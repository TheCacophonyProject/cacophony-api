var config = require('../../config');
var util = require('./util');
var log = require('../../logging');
var passport = require('passport');
var config = require('../../config');
var AWS = require('aws-sdk');
var responseUtil = require('./responseUtil');

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
          responseUtil.serverError(response, err);
        } else {
          response.setHeader('Content-disposition', 'attachment; filename='+filename);
          response.setHeader('Content-type', mimeType);
          response.write(data.Body, 'binary');
          response.end(null, 'binary');
        }
      });

    });
};
