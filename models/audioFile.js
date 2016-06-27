var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

/**
 * AudioFile represents a model showing the different fields and if they are a special case (file or child model).
 * This model will be saved in the "audioFiles" table in the database.
 *
 * @module audioFile
 *
 * @param {Object}  data  This is the metadata of the file and the file it self. The file should be in data.__file
 */
module.exports = function(data) {
  log.verbose('New AudioFile Object');

  this.name = 'audioFile';
  this.ormClass = orm.audioFile;

  this.modelMap = {
    id: {},                         // ID of the audioFile in the database.
    uploadTimestamp: {},            // Timestamp when the file was uploaded using ISO 8601.
    fileLocation: { file: true },   // location of file in S3 server.
    startTimestamp: {},             // Timestamp of when the recording started.
    recordingDateTime: {},          // DateTime of recording.
    duration: {},                   // Duration of audio recording in seconds.
    fileExtension: {},              // The file extension.
    mimeType: {},                   // The mineType.
    bitrate: {},                    // Bitrate of recording in kbps.
    size: {},                       // Size in kB.
    sampleRate: {},                 // Sample rate in Hz
    channels: {},                   // Audio channels.
    tags: {},
    extra: {}
  }
  this.fileLocationField = this.modelMap.fileLocation;  // Showing where the file location is to be saved.

  this.localFileLocation = null;
  this.ormBuild = null;             // The ORM build of this model.
  this.modelData = {};              // JSON of the metadata excluding the child models.
  this.childModels = [];            // List of the child models.

  if (data) {util.parseModel(this, data);}

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
