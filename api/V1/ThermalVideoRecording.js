var models = require('../../models');
var formidable = require('formidable');
var config = require('../../config.js');
var knox = require('knox');
var path = require('path');
var util = require('./util');
var passport = require('passport');
require('../../passportConfig')(passport);


module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/thermalvideorecordings';

  app.post(apiUrl, passport.authenticate(['jwt'], { session: false }), function(req, res) {
    var device = req.user; // passport put the jwt in the user field. But for us it's a device.

    // Chech that they validated as a device. Not a user.
    if (device.$modelOptions.name.singular != 'Device') {
      return util.handleResponse(res, {
        success: false,
        statusCode: 401,
        messages: ["JWT was not from a device."]
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
        var model = models.ThermalVideoRecording.build(
          data, {
            fields: models.ThermalVideoRecording.apiSettableFields // Limit what fields can be set by the user.
          });

        // Add device data to recording.

        model.setDataValue('DeviceId', device.id); // From JWT.
        model.setDataValue('GroupId', device.GroupId); // FROM JWT.
        if (typeof device.public == 'boolean')
          model.setDataValue('public', device.public); // From JWT TODO Check if this has been updated.
        else
          model.setDataValue('public', false); // Not public by default.

        // Save model to database.
        model.save()
          .then(function() { // Successful post.
            messages.push("Thanks for the Thermal Video Recording!");
            util.handleResponse(res, {
              success: true,
              statusCode: 200,
              messages: messages
            });
          })
          .catch(function(err) { // Upload to database failed.
            util.serverErrorResponse(res, err);
          });

        // Process and upload file.
        util.convertVideo(file)
          .then((convertVideo) => util.uploadToS3(convertVideo, s3Path))
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
            log.error("Upload error");
            //model.uploadFileError(err); //TODO add
          });
      })
      .catch(function(err) { // Erorr with parsing post.
        console.log("Error with parssing post.");
        util.serverErrorResponse(res, err);
      });
  });

  app.get(
    apiUrl,
    passport.authenticate(['jwt', 'anonymous'], { session: false }),
    function(req, res) {

      // Same code used for getting recordings (Audio, Thermal Video, and IR Video)
      return util.getRecordingsFromModel(models.ThermalVideoRecording, req, res);
    });
};
