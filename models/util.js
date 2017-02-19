var log = require('../logging');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');

function findAllWithUser(model, user, queryParams) {
  return new Promise(function(resolve, reject) {
    var models = require('./');
    if (typeof queryParams.limit == 'undefined') queryParams.limit = 20;
    if (typeof queryParams.offset == 'undefined') queryParams.offset = 0;

    // Find what devices the user can see.
    if (!user) {
      // Not logged in, can onnly see public recordings.
      model.findAll({
        where: { "$and": [queryParams.where, { public: true }] },
        include: [models.Group],
        limit: queryParams.limit,
        offset: queryParams.offset
      }).then((result) => resolve(result));
    } else {
      models.User.findOne({ where: user.id }) //TODO find a better way do deal with the require.
        .then((user) => user.getGroupsIds())
        .then(function(ids) {
          // Adding filter so they only see recordings that they are allowed to.
          queryParams.where = {
            "$and": [
              queryParams.where,
              { "$or": [{ public: true }, { GroupId: { "$in": ids } }] }
            ]
          };
          queryParams.include = [models.Group];
          queryParams.limit = queryParams.limit;
          queryParams.offset = queryParams.offset;
          return model.findAndCount(queryParams);
        }).then(function(result) {
          result.limit = queryParams.limit;
          result.offset = queryParams.offset;
          resolve(result);
        });
    }
  });
}

/**
 * Converts the audio file to a mp3, if not one already.
 * @param {Object} file - Audio file.
 * @return {Promise} resolves with the file path.
 */
function processAudio(file) {
  log.debug('Processing audio file.');
  return new Promise(function(resolve, reject) {
    if (file.type != 'audio/mp3') {
      var convertedAudioPath = file.path + '.mp3';
      ffmpeg(file.path)
        .output(convertedAudioPath)
        .on('end', function() {
          fs.unlink(file.path);
          resolve(convertedAudioPath);
        })
        .on('error', function(err) {
          fs.unlink(file.path);
          reject(err);
        })
        .run();
    } else {
      resolve(file.path);
    }
  });
}

/**
 * Converts the video file to a mp4, if not one already.
 * @param {Object} file - Audio file.
 * @return {Promise} resolves with the file path.
 */
function processVideo(file) {
  log.debug('Processing video file.');
  return new Promise(function(resolve, reject) {
    if (file.type != 'video/mp4') {
      var convertedVideoPath = file.path + '.mp4';
      ffmpeg(file.path)
        .output(convertedVideoPath)
        .on('end', function() {
          fs.unlink(file.path);
          resolve(convertedVideoPath);
        })
        .on('error', function(err) {
          fs.unlink(file.path);
          reject(err);
        })
        .run();
    } else {
      resolve(file.path);
    }
  });
}

exports.findAllWithUser = findAllWithUser;
exports.processAudio = processAudio;
exports.processVideo = processVideo;
