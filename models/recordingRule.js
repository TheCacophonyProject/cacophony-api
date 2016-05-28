var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

/**
 * RecordingRule represents a model showing the different fields and if they are a special case (file or child model).
 * This model will be saved in the "recordingRules" table in the database.
 *
 * @module recordingRule
 *
 * @param {Object}  data  This is the metadata of the recordingRule.
 */

module.exports = function(data) {
  log.verbose('New recordingRule Object');

  this.name = 'recordingRule';
  this.ormClass = orm.recordingRule;

  this.modelMap = {
    startTimestamp: {},   // Timestamp of when the recording starts.
    id: {},               // ID of the recordingRule in the database using ISO 8601.
    duration: {},         // Duration in seconds of the recording for this rule.
    name: {},             // Name of this rule.
    extra: {},
    tags: {}
  }

  this.ormBuild = null;   // The ORM build of this model.
  this.modelData = {};    // JSON of the metadata excluding the child models.
  this.childModels = [];  // List of the child models.

  if (data) util.parseModel(this, data);

  var model = this;
  this.query = function(q, apiVersion) {
    console.log("Quering some "+model.name+": "+JSON.stringify(q));
    switch(apiVersion) {
      case 1:
        return apiV1Query(q);
        break;
      default:
        log.warn("No api version given.");
        return;
        break;
    }
  }

  function apiV1Query(q) {
    return util.getModelsJsonFromQuery(q, model, 1);
  }
}
