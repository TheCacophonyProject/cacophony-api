var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

module.exports = function(data) {
  log.verbose('New hardware Object');
  this.name = 'hardware';
  this.ormClass = orm.hardware;
  this.modelMap = {
    id: {},
    manufacturer: {},
    model: {},
    brand: {},
    url: {},
    solarPanelPower: {},
    batterySize: {},
    extra: {},
    tags: {}
  }

  this.ormBuild = null;
  this.modelData = {};
  this.childModels = [];
  util.parseModel(this, data);
}
