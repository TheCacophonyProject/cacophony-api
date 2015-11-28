var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

module.exports = function(data) {
  log.verbose('New device Object');

  this.name = 'device';
  this.ormClass = orm.device;

  this.modelMap = {
    id: {},
    type: {},
    extra: {}
  }

  this.ormBuild = null;
  this.modelData = {};
  this.childModels = [];

  util.parseModel(this, data);
}
