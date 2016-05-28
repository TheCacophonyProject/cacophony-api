var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

/**
 * VideoFile represents a model showing the different fields and if they are a special case (file or child model).
 * This model will be saved in the "videoFiles" table in the database.
 *
 * @module videoFile
 *
 * @param {Object}  data  This is the metadata of the file and the file it self. The file should be in data.__file
 */

module.exports = function(data) {
  log.verbose('New VideoFile Object');

  this.name = 'videoFile';
  this.ormClass = orm.videoFile;

  this.modelMap = {
    id: {},                         // ID of the videoFile in the database.
    uploadTimestamp: {},            // Timestamp when the file was uploaded using ISO 8601.
    fileLocation: { file: true },   // Location of the file in the S3 server.
    startTimestamp: {},             // Timestamp of when the recording started using ISO 8601.
    duration: {},                   // Duration of recording in seconds.
    fileExtension: {},              // The file extension.
    mimeType: {},                   // MimeType of file.
    videoBitrate: {},               // Bitrate of video in kbps.
    dimensionX: {},                 // Pixel height of video.
    dimentionY: {},                 // Pixel width of video.
    fps: {},                        // Frames per second of video.
    size: {},                       // Size of video in kB.
    audioChannels: {},              // Audio channels.
    audioSampleRate: {},            // Audio sample rate in Hz.
    audioBitrate: {},               // Audio bitrate in kbps.
    tags: {},
    extra: {},
  }
  this.fileLocationField = this.modelMap.fileLocation;  // Showing where the file location is to be saved.

  this.localFileLocation = null;
  this.ormBuild = null;   // The ORM build of this model.
  this.modelData = {};    // JSON of the metadata excluding teh child models.
  this.childModels = [];  // List of the child models.

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
