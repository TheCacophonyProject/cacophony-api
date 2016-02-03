var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

/**
 * Hardware represents a model showing the different fields and if they are a special case (file or child model).
 * This model will be saved in the "hardware" table in the database.
 *
 * @module hardware
 *
 * @param {Object}  data  This is the metadata of the hardware.
 */

module.exports = function(data) {
  log.verbose('New hardware Object');

  this.name = 'hardware';
  this.ormClass = orm.hardware;

  this.modelMap = {
    id: {},               // ID of the hardware in the database.
    manufacturer: {},     // Manufacturer of the hardware.
    model: {},            // Model number of the hardware.
    brand: {},            // Brand of the hardware.
    url: {},              // URL to a datasheet of the hardware.
    solarPanelPower: {},  // Solar Panel power in mW.
    batterySize: {},      // Battery Size in Wh.
    extra: {},
    tags: {}
  }

  this.ormBuild = null;     // The ORM build of this model.
  this.modelData = {};      // JSON of the metadata excluding the child models.
  this.childModels = [];    // List of the child models.

  util.parseModel(this, data);
}
