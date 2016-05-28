var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

/**
 * Device represents a model showing different fields and if they are a special type (file or child model).
 * This model will be saved in the "devices" table in the database.
 *
 * @module device
 *
 * @param {Object}  data  This is the metadata of the device.
 */

module.exports = function(data) {
  log.verbose('New device Object');

  this.name = 'device';
  this.ormClass = orm.device;

  this.modelMap = {
    id: {},           // ID of the device in the database.
    type: {},         // Type of device.
    extra: {}
  }

  this.ormBuild = null;   // The ORM build of this model.
  this.modelData = {};    // JSON of the metadata excluding the child models.
  this.childModels = [];  // List of the child models.

  if (data) util.parseModel(this, data);

  var model = this;
  this.query = function(q, apiVersion) {
    log.debug("Quering some "+model.name+": "+JSON.stringify(q));
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
