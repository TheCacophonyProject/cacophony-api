var models = require('../../models');
var formidable = require('formidable');
var config = require('../../config.js');
var knox = require('knox');
var path = require('path');
var util = require('./util');
var passport = require('passport');
require('../../passportConfig')(passport);


module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/audiorecordings';

  app.post(apiUrl, passport.authenticate(['jwt', 'anonymous'], { session: false }), function(req,
    res) {
    var device = req.user; // passport put the jwt in the user field. But for us it's a device.
    //TODO check that device is valid. Id not redirect to device authentication..
    if (typeof device == 'undefined') {
      console.log("No device found in audio recordign.");
      return util.handleResponse(res, {
        success: false,
        statusCode: 400,
        messages: ['No device with audio recording.']
      });
    }

    util.fileAndDataFromPost(req)
      .then(function(result) {
        var file = result.file;
        var data = result.data;
        var messages = [];
        var errorMessages = [];

        // Generate file URL
        var date = util.getDateFromMetadata(data);
        var s3Path = util.s3PathFromDate(date) + path.extname(file.name);

        // Create IR Video Recording and save to database.
        var model = models.AudioRecording.build(
          data, {
            fields: models.AudioRecording.apiSettableFields // Limit what fields can be set by the user.
          });

        // Add device data to recording.
        model.setDataValue('DeviceId', device.id); // From JWT.
        model.setDataValue('GroupId', device.GroupId); // FROM JWT.
        if (typeof device.public == 'boolean')
          model.setDataValue('public', device.public); // From JWT TODO Check if this has been updated.
        else
          model.setDataValue('public', false);  // Not public by defult.

        // Save model to database.
        model.save()
          .then(function() { // Successful post.
            messages.push("Thanks for the Audio Recording!");
            util.handleResponse(res, {
              success: true,
              statusCode: 200,
              messages: messages
            });
          })
          .catch(function(err) { // Upload to database failed.
            util.serverErrorResponse(res, err);
          });

        // Upload file.
        util.convertAudio(file)
          .then(function(convertedAudio) {
            return util.uploadToS3(convertedAudio, s3Path);
          })
          .then(function(res) {
            if (res.statusCode == 200) {
              console.log("Uploaded File.");
              model.uploadFileSuccess(res);
            } else {
              console.log("Upload failed.");
              //model.uploadFileError(res); //TODO add
            }
          })
          .catch(function(err) {
            console.log("Upload error");
            //model.uploadFileError(err); //TODO add
          });
      })
      .catch(function(err) { // Erorr with parsing post.
        console.log("Error with parsing post.");
        util.serverErrorResponse(res, err);
      });
  });

  /**
   *  Get request for Audio Recordings.
   *  headers.where,  Sequelize conditions for query,
   *  headres.offset, Query offset.
   *  headers.limit,  Query results limit.
   */
  app.get(apiUrl, passport.authenticate(['jwt', 'anonymous'], { session: false }),
    function(req, res) {
      var queryParams = util.getSequelizeQueryFromHeaders(req);
      // Return HTTP 400 if error when getting query from headers.
      if (queryParams.error) {
        return util.handleResponse(res, {
          success: false,
          statusCode: 400,
          messages: queryParams.errMsgs
        });
      }

      // Check if authorization of a User by JWT failed.
      if (!req.user && req.headers.authorization) {
        //TODO Redirect to login page, note on login page that can can query an anonymous user but will not see recording private to that user.
        //TODO maybe I can set up the anonymous passport to do this?
      }

      // Request was valid. Now quering database.
      models.AudioRecording.findAllWithUser(req.user, queryParams)
        .then(function(models) {
          var result = [];
          for (var key in models) result.push(models[key].getFrontendFields());
          return util.handleResponse(res, {
            success: true,
            statusCode: 200,
            messages: ["Successful request."],
            result: result
          });
        });
    });
};
