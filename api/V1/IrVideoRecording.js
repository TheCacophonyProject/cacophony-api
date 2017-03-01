var models = require('../../models');
var util = require('./util');
var passport = require('passport');
var log = require('../../logging');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/irvideorecordings';

  app.post(
    apiUrl,
    passport.authenticate(['jwt'], { session: false }),
    function(req, res) {
      log.info(req.method + " Request: " + req.url);
      var device = req.user; // passport put the jwt in the user field. But for us it's a device.
      return util.addRecordingFromPost(models.IrVideoRecording, req, res, device);
    });

  /**
   * Put request to update a IR Video Recording.
   * headers.data,  JSON of data to update.
   */
  app.put(
    apiUrl + "/:id",
    passport.authenticate(['jwt'], { session: false }),
    function(req, res) {
      log.info(req.method + " Request: " + req.url);
      return util.updateDataFromPut(models.IrVideoRecording, req, res);
    });

  app.delete(
    apiUrl + '/:id',
    passport.authenticate(['jwt'], { session: false }),
    function(req, res) {
      log.info(req.method + " Request: " + req.url);
      return util.deleteDataPoint(models.IrVideoRecording, req, res);
    });

  /**
   *  Get request for IR Video Recordings.
   *  headers.where,  Sequelize conditions for query,
   *  headres.offset, Query offset.
   *  headers.limit,  Query results limit.
   */
  app.get(
    apiUrl,
    passport.authenticate(['jwt', 'anonymous'], { session: false }),
    function(req, res) {
      log.info(req.method + " Request: " + req.url);
      return util.getRecordingsFromModel(models.IrVideoRecording, req, res);
    });

  app.get(
    apiUrl + "/:id",
    passport.authenticate(['jwt', 'anonymous'], { session: false }),
    function(req, res) {
      log.info(req.method + " Request: " + req.url);
      return util.getRecordingFile(models.IrVideoRecording, req, res);
    });
};
