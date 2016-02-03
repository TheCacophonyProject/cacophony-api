var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

/**
 * Microphone represents a model showing the different fields and if they are a special case (file or child model).
 * This model will be saved in the "microphones" table in the database.
 *
 * @module microphone
 *
 * @param {Object}  data  This is the metadata of the microphone.
 */

module.exports = function(data) {
  log.verbose('New microphone Object');

  this.name = 'microphone';
  this.ormClass = orm.microphone;

  this.modelMap = {
    id: {},                  // ID of the microphone in the database.
    dateOfCalibration: {},   // Date of when the microphone was calibrated.
    type: {},                // Type of microphone used
    name: {},                // Name given to this microphone.
    extra: {},
    tags: {}
  };

  this.ormBuild = null;   // The ORM build of this model.
  this.modelData = {};    // JSON of the metadata excluding the child models.
  this.childModels = [];  // List of the child models.

  util.parseModel(this, data);
}
