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

  /*
    app.put(apiUrl, function(req, res) {
      // TODO check if the user is able to update this model instance.
      // For now anybody can change it....

      // Validate query data.
      models.IrVideoRecording.findOne({ where: { id: req.body.id } })
        .then(function(model) {
          try {
            data = JSON.parse(req.body.data);
            return model.update(data);
          } catch (err) {
            //TODO Throw error here saying couldn't parse data
          }
        })
        .then(function(model) {
          res.status(200).json({ success: true, msg: ["Updated model."] })
        })
        .catch(function(err) {
          res.status(400).json({ success: false, msg: ["Failed to update model."] })
        })
    });
    */

  /*
    app.delete(apiUrl, function(req, res) {
      console.log("Deleteing IR Video Recording.");
      // TODO check if they have permission to do this to the model instance...
      // TODO ceck that there is an ID in the request body.
      // TODO Delete file from S3 server.
      models.IrVideoRecording.findOne({ where: { id: req.body.id } })
        .then(function(model) {
          // TODO Delete file from database.
          return model.destroy();
        })
        .then(function() {
          req.status(200).json({ success: true, msg: "It's gone." })
        })
        .catch(function() {
          res.status(400).json({ success: false, msg: "Failed to delete." })
        })
    });
    */

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
