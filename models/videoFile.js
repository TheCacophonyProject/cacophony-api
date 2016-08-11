var util = require('./util');
var orm = require('./orm');
var log = require('../logging');
var cmd = require('node-cmd');

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
    recordingDateTime: {},          // DateTime of recording.
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

  if (data && data.__file) parseVideoFile(this, data);
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

  function parseVideoFile(model, data) {
    var file = data.__file;
    var date;
    var dateISOString;
    if (data.recordingDateTime) {
      try {
        date = new Date(data.recordingDateTime);
        dateISOString = date.toISOString();
      } catch (err) {
        log.warn('Error from paring recordingDateTime:', err);
        log.warn('recordingDateTime', data.recordingDateTime);
        date = new Date();
        dateISOString = date.toISOString();
      }
    } else {
      date = new Date();
      dateISOString = date.toISOString();
    }
    var year = date.getFullYear();
    var month = date.getMonth();
    var randStr = Math.random().toString(36).substr(2);
    var uploadPath = year+'/'+month+'/'+dateISOString+'_'+randStr+'.mp4'
    var localPath = data.__file.path;
    if (file.type != 'video/mp4') {
      var ffmpegCmd = 'ffmpeg -i '+file.path+' '+file.path+'.mp4';
      cmd.get(ffmpegCmd, function() {
        log.debug("Finished converting file.");
        util.uploadFile(file.path+'.mp4', uploadPath)
        .then(function () {
          cmd.get('rm '+file.path+'.mp4');
        });
      });
    } else {
      util.uploadFile(file.path, uploadPath);
    }
    data.fileLocation = uploadPath;
  }
}
