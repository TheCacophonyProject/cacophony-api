var models = require('../../models');
var util = require('./util');
var passport = require('passport');
var log = require('../../logging');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/thermalvideorecordings';

  app.post(
    apiUrl,
    passport.authenticate(['jwt'], { session: false }),
    function(req, res) {
      log.info(req.method + " Request: " + req.url);
      var device = req.user; // passport put the jwt in the user field. But for us it's a device.
      return util.addRecordingFromPost(models.ThermalVideoRecording, req, res, device);
    });

  /**
   *  Put request to update a Thermal Video Recording.
   *  headers.data,  JSON of data to update.
   */
  app.put(
    apiUrl + "/:id",
    passport.authenticate(['jwt'], { session: false }),
    function(req, res) {
      log.info(req.method + " Request: " + req.url);
      return util.updateDataFromPut(models.ThermalVideoRecording, req, res);
    });

  app.delete(
    apiUrl + '/:id',
    passport.authenticate(['jwt'], { session: false }),
    function(req, res) {
      log.info(req.method + " Request: " + req.url);
      return util.deleteDataPoint(models.ThermalVideoRecording, req, res);
    });

  app.get(
    apiUrl,
    passport.authenticate(['jwt', 'anonymous'], { session: false }),
    function(req, res) {
      log.info(req.method + " Request: " + req.url);
      return util.getRecordingsFromModel(models.ThermalVideoRecording, req, res);
    });

  app.get(
    apiUrl + "/:id",
    passport.authenticate(['jwt', 'anonymous'], { session: false }),
    function(req, res) {
      log.info(req.method + " Request: " + req.url);
      return util.getRecordingFile(models.ThermalVideoRecording, req, res);
    });
};
