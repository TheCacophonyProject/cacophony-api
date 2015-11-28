var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

module.exports = function(data) {
  log.verbose('New AudioFile Object');

  this.name = 'audioFile';
  this.ormClass = orm.audioFile;

  this.modelMap = {
    id: {},
    uploadTimestamp: {},
    fileLocation: { file: true },
    startTimestamp: {},
    duration: {},
    fileExtension: {},
    mimeType: {},
    bitrate: {},
    size: {},
    sampleRate: {},
    channels: {},
    tags: {},
    extra: {}
  }
  this.fileLocationField = this.modelMap.fileLocation;

  this.localFileLocation = null;
  this.ormBuild = null;
  this.modelData = {};
  this.childModels = [];

  util.parseModel(this, data);
}
