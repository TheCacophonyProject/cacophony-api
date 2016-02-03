var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

/**
 * Software represents a model showing the different fields and if they are a special case (file or child model).
 * This model will be saved in the "software" table in the database.
 *
 * @module software
 *
 * @param {Object}  data  This is the metadata of the software.
 */

module.exports = function(data) {
  log.verbose('New software Object');

  this.name = 'software';
  this.ormClass = orm.software;

  this.modelMap = {
    id: {},             // ID of the software in the database.
    osCodename: {},     // OS codename.
    osIncremental: {},  // OS Incremental number.
    sdkInt: {},         // Int of the SDK being used.
    osRelease: {},      // OS of the release.
    version: {},        // Vesion of the software.
    extra: {},
    tags: {}
  }

  this.ormBuild = null;   // The ORM build of this model.
  this.modelData = {};    // JSON of the metadata excluding the child models.
  this.childModels = [];  // List of the child models.

  util.parseModel(this, data);
}
