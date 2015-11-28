var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

module.exports = function(data) {
  log.verbose('New VideoFile Object');

  this.name = 'videoFile';
  this.ormClass = orm.videoFile;

  this.modelMap = {
    id: {},
    uploadTimestamp: {},
    fileLocation: { file: true },
    startTimestamp: {},
    duration: {},
    fileExtension: {},
    mimeType: {},
    videoBitrate: {},
    dimensionX: {},
    dimentionY: {},
    fps: {},
    size: {},
    audioChannels: {},
    audioSampleRate: {},
    audioBitrate: {},
    tags: {},
    extra: {},
  }
  this.fileLocationField = this.modelMap.fileLocation;

  this.localFileLocation = null;
  this.ormBuild = null;
  this.modelData = {};
  this.childModels = [];

  util.parseModel(this, data);
}
