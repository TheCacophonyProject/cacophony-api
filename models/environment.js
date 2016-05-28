var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

/**
 * Environment represents a model showing the different fields and if they are a special case (file or child model).
 * This model will be saved in the "environments" table in the database.
 *
 * @module environment
 *
 * @param {Object}  data  This is the metadata of the environment.
 */

module.exports = function(data) {
  log.verbose('New environment Object');

  this.name = 'environment';
  this.ormClass = orm.environment;

  this.modelMap = {
    id: {},                 // ID of the environment in the database.
    tempreature: {},        // Tempreature in celsius.
    localTempreature: {},   // Boolean of if the tempreature was a local measurment.
    rainfall: {},           // Rainfall in mm.
    localRainfall: {},      // Boolean of if the rainfall was a local measurment.
    humidity: {},           // Humidity in percentage.
    localHumidity: {},      // Boolean of if the humidity was a local measurment.
    lightLevel: {},         // Light level in luminous.
    localLightLevel: {},    // Boolean of it the light level was a local measurment.
    pressure: {},           // Pressure in hectoPascals.
    localPressure: {},      // Boolean of if the pressure was a local measurment.
    windDirection: {},      // Wind direction as a bearing from North.
    localWindDirection: {}, // Boolean of if the wind direction was a local measurment.
    windMagnitude: {},      // Wind magnitude in m/s.
    localWindMangitude: {}, // Boolean of if the wind direction was a local measurment.
    weatherStation: {},     // Weather station that was used for non local measurments.
    tags: {},
    extra: {}
  }
  this.ormBuild = null;     // The ORM build of this model.
  this.modelData = {};      // JSON of the metadata excluding child models.
  this.childModels = [];    // List of the child models.

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
