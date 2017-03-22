var db = require('../../models');
var util = require('./util');
var passport = require('passport');
var log = require('../../logging');
var tagsUtil = require('./tagsUtil');
var requestUtil = require('./requestUtil');
var responseUtil = require('./responseUtil');

var MISSING_FIELDS =
  'Missing one or more field. "thermalData", "irData", "thermalVideo", ' +
  '"irVideo"';

/**
 * This API is for uploadiing a thermal and an IR video that are recorded at
 * the same time.
 */

module.exports = function(app, baseUrl) {
  'use strict';
  var apiUrl = baseUrl + '/thermalirvideopair';

  app.post(
    apiUrl,
    passport.authenticate(['jwt'], { session: false }),
    function(req, res) {
      log.info(req.method + " Request: " + req.url);

      if (req.user !== null && !requestUtil.isFromADevice(req))
        return responseUtil.notFromADevice(res);

      var thermalModel;
      var irModel;
      var thermalVideo;
      var irVideo;
      requestUtil
        .getFieldsAndFiles(req)
        .then(([files, fields]) => {

          var thermalData = util.parseJsonFromString(fields.thermalData);
          var irData = util.parseJsonFromString(fields.irData);
          thermalVideo = files.thermalVideo;
          irVideo = files.irVideo;

          if (!thermalData || !irData || !thermalVideo || !irVideo)
            throw { badRequest: MISSING_FIELDS };

          // Build models
          thermalModel = db.ThermalVideoRecording.build(thermalData, {
            fields: db.ThermalVideoRecording.apiSettableFields,
          });
          irModel = db.IrVideoRecording.build(irData, {
            fields: db.IrVideoRecording.apiSettableFields,
          });

          // Relate models to each other.
          //thermalModel.setIrVideoRecording(irModel);

          // Add models device and group.
          thermalModel.set('DeviceId', req.user.id);
          thermalModel.set('GroupId', req.user.GroupId);
          irModel.set('DeviceId', req.user.id);
          irModel.set('GroupId', req.user.GroupId);

          //return irModel.validate();
          return irModel.save();
        })
        //.then(() => thermalModel.validate())
        //.then(() => irModel.save())
        .then((irModel) => {
          thermalModel.set('IrVideoRecordingId', irModel.id);
          return thermalModel.save();
        })
        .then(() => responseUtil.validThermalIrVideoPair(res))
        .then(() => irModel.processRecording(irVideo))
        .then((file) => irModel.saveFile(file))
        .then(() => thermalModel.processRecording(thermalVideo))
        .then((file) => thermalModel.saveFile(file))
        .catch(err => {
          util.catchError(err, res, responseUtil.invalidVideoPair);
        });
    });
};
