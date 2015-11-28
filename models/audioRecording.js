var util = require('./util');
var orm = require('./orm');
var log = require('../logging');
var AudioFile = require('./audioFile');
var Device = require('./device');
var RecordingRule = require('./recordingRule');
var Location = require('./location');
var Hardware = require('./hardware');
var Software = require('./software');
var Microphone = require('./microphone');
var Environment = require('./environment');

module.exports = function(data) {
  log.verbose('New AudioRecording Object');

  this.name = 'audioRecording';
  this.ormClass = orm.audioRecording;
  this.modelMap = {
    id: {},
    audioFile: {model: AudioFile },
    device: { model: Device },
    recordingRule: { model: RecordingRule },
    location: { model: Location },
    hardware: { model: Hardware },
    software: { model: Software },
    microphone: { model: Microphone },
    environment: { model: Environment },
    tags: {},
    extra: {}
  }

  this.ormBuild = null;
  this.modelData = {};
  this.childModels = [];

  util.parseModel(this, data);
}
