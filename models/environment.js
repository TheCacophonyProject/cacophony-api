var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

module.exports = function(data) {
  log.verbose('New environment Object');

  this.name = 'environment';
  this.ormClass = orm.environment;

  this.modelMap = {
    id: {},
    tempreature: {},
    localTempreature: {},
    rainfall: {},
    localRainfall: {},
    humidity: {},
    localHumidity: {},
    lightLevel: {},
    localLightLevel: {},
    pressure: {},
    localPressure: {},
    windDirection: {},
    localWindDirection: {},
    windMagnitude: {},
    localWindMangitude: {},
    weatherStation: {},
    tags: {},
    extra: {}
  }
  this.ormBuild = null;
  this.modelData = {};
  this.childModels = [];

  util.parseModel(this, data);
}
