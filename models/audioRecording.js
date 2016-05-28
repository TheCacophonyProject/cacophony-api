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

/**
 * AudioRecording represents a model showing the different fields and if they are a special case (file or child model).
 * This model will be saved in the "audioRecordings" table in the database.
 *
 * @module audioRecording
 *
 * @param {Object}  data  This is the metadata of the audio recording.
 */

module.exports = function(data) {
  log.verbose('New AudioRecording Object');

  this.name = 'audioRecording';
  this.ormClass = orm.audioRecording;

  this.modelMap = {
    id: {},                                   // ID of the audioRecording.
    audioFile: {model: AudioFile },           // AudioFile model.
    device: { model: Device },                // Device model.
    recordingRule: { model: RecordingRule },  // RecordingRule model.
    location: { model: Location },            // Location model.
    hardware: { model: Hardware },            // Hardware model.
    software: { model: Software },            // Software model.
    microphone: { model: Microphone },        // Microphone model.
    environment: { model: Environment },      // Environment model.
    batteryPercentage: {},                    // Percnetage of cellphone battery charge. Excluding external battery.
    tags: {},
    extra: {}
  }

  this.ormBuild = null;     // The ORM build of this model.
  this.modelData = {};      // JSON of the metadata excluding the child models.
  this.childModels = [];    // List of child models.

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
