var models = require('../../models');
var util = require('./util');
var passport = require('passport');
var log = require('../../logging');
var tagsUtil = require('./tagsUtil');
var responseUtil = require('./responseUtil');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/irvideorecordings';

  app.post(
    apiUrl,
    passport.authenticate(['jwt'], { session: false }),
    function(req, res) {
      log.info(req.method + " Request: " + req.url);
      return util.addRecordingFromPost(models.IrVideoRecording, req, res);
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

  app.post(
    apiUrl + "/:id/tags",
    passport.authenticate(['jwt', 'anonymous'], { session: false }),
    function(req, res) {
      log.info(req.method + " Request: " + req.url);
      return tagsUtil.add(models.IrVideoRecording, req, res);
    });

  app.delete(
    apiUrl + '/:id/tags',
    passport.authenticate(['jwt', 'anonymous'], { session: false }),
    function(req, res) {
      log.info(req.method + " Request: " + req.url);
      return tagsUtil.remove(models.IrVideoRecording, req, res);
    });

  app.get(
    apiUrl + '/:id/tags',
    passport.authenticate(['jwt', 'anonymous'], { session: false }),
    function(req, res) {
      log.info(req.method + " Request: " + req.url);
      return tagsUtil.get(models.AudioRecording, req, res);
    });

  app.get(
    apiUrl + '/:id/videopair',
    passport.authenticate(['jwt', 'anonymous'], { session: false }),
    function(req, res) {

      var id = parseInt(req.params.id);
      if (!id)
        return responseUtil.invalidDataId(res);

      models.IrVideoRecording
        .getFromId(id, req.user)
        .then(irM => {
          return irM.getThermalVideoRecording();
        })
        .then(thermalM => responseUtil.validGetDatapoint(res, thermalM));

    });
};
