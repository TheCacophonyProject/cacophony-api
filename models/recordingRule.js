var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

module.exports = function(data) {
  log.verbose('New recordingRule Object');

  this.name = 'recordingRule';
  this.ormClass = orm.recordingRule;

  this.modelMap = {
    id: {},
    startTimestamp: {},
    duration: {},
    name: {},
    extra: {},
    tags: {}
  }
  this.ormBuild = null;
  this.modelData = {};
  this.childModels = [];

  util.parseModel(this, data);
}
