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

  app.post(
    apiUrl,
    passport.authenticate(['jwt'], { session: false }),
    function(req, res) {

      var device = req.user; // passport put the jwt in the user field. But for us it's a device.
      return util.addRecordingFromPost(models.IrVideoRecording, req, res, device);
    });

  app.get(
    apiUrl,
    passport.authenticate(['jwt', 'anonymous'], { session: false }),
    function(req, res) {

      // Same code used for getting recordings (Audio, Thermal Video, and IR Video)
      return util.getRecordingsFromModel(models.ThermalVideoRecording, req, res);
    });
};
