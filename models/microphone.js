var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

module.exports = function(data) {
  log.verbose('New microphone Object');

  this.name = 'microphone';
  this.ormClass = orm.microphone;
  this.modelMap = {
    id: {},
    dateOfCalibration: {},
    type: {},
    name: {},
    extra: {},
    tags: {}
  };

  this.ormBuild = null;
  this.modelData = {};
  this.childModels = [];

  util.parseModel(this, data);
}
