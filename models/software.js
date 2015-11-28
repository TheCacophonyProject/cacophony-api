var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

module.exports = function(data) {
  log.verbose('New software Object');
  this.name = 'software';
  this.ormClass = orm.software;
  this.modelMap = {
    id: {},
    osCodename: {},
    osIncremental: {},
    sdkInt: {},
    osRelease: {},
    version: {},
    extra: {},
    tags: {}
  }

  this.ormBuild = null;
  this.modelData = {};
  this.childModels = [];
  util.parseModel(this, data);
}
