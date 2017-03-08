var log = require('../logging');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var mime = require('mime');
var path = require('path');
var AWS = require('aws-sdk');
var config = require('../config.js');

function findAllWithUser(model, user, queryParams) {
  return new Promise(function(resolve, reject) {
    var models = require('./');
    if (typeof queryParams.limit == 'undefined') queryParams.limit = 20;
    if (typeof queryParams.offset == 'undefined') queryParams.offset = 0;

    // Find what devices the user can see.
    if (!user) {
      // Not logged in, can onnly see public recordings.
      model.findAndCount({
        where: { "$and": [queryParams.where, { public: true }] },
        include: [models.Group],
        limit: queryParams.limit,
        offset: queryParams.offset
      }).then(function(result) {
        result.limit = queryParams.limit;
        result.offset = queryParams.offset;
        resolve(result);
      });
    } else {
      user.getGroupsIds()
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
          resolve(getMetadataFromFile(convertedAudioPath));
        })
        .on('error', function(err) {
          fs.unlink(file.path);
          reject(err);
        })
        .run();
    } else {
      resolve(getMetadataFromFile(file.path, file.type));
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
          resolve(getMetadataFromFile(convertedVideoPath));
        })
        .on('error', function(err) {
          fs.unlink(file.path);
          reject(err);
        })
        .run();
    } else {
      resolve(getMetadataFromFile(file.path, file.type));
    }
  });
}

function getMetadataFromFile(filePath, mimeType) {
  return new Promise(function(resolve, reject) {
    var size = fs.statSync(filePath).size || 0;
    mimeType = mimeType || mime.lookup(filePath);
    var extname = path.extname(filePath) || '';
    var fileData = {
      path: filePath,
      mimeType: mimeType,
      extname: extname,
      size: size,
    };
    resolve(fileData);
  });
}

function getFileData(model, id, user) {
  return new Promise(function(resolve, reject) {
    findAllWithUser(model, user, { where: { id } })
      .then(function(result) {
        if (result.rows !== null && result.rows.length >= 1) {
          var model = result.rows[0];
          var fileData = {
            key: model.getDataValue('fileKey'),
            name: getFileName(model),
            mimeType: model.getDataValue('mimeType'),
          };
          return resolve(fileData);
        } else
          return resolve(null);
      })
      .catch(function(err) {
        log.error("Error at models/util.js getFileKey:");
        reject(err);
      });
  });
}

function getFileName(model) {
  var fileName;
  var dateStr = model.getDataValue('recordingDateTime');
  if (dateStr)
    fileName = new Date(dateStr).toISOString().replace(/\..+/, '').replace(/:/g,
      '');
  else
    fileName = 'file';

  var ext = mime.extension(model.getDataValue('mimeType') || '');
  if (ext) fileName = fileName + '.' + ext;
  return fileName;
}

function saveFile(file) {
  var model = this;
  return new Promise(function(resolve, reject) {

    // Gets date object set to recordingDateTime field or now if field not set.
    var date = new Date(model.getDataValue('recordingDateTime') || new Date());

    // Generate key for file using the date.
    var key = date.getFullYear() + '/' + date.getMonth() + '/' +
      date.toISOString().replace(/\..+/, '').replace(/:/g, '') + '_' +
      Math.random().toString(36).substr(2);

    // Create AWS S3 object
    var s3 = new AWS.S3({
      endpoint: config.s3.endpoint,
      accessKeyId: config.s3.publicKey,
      secretAccessKey: config.s3.privateKey,
    });

    // Save file with key.
    fs.readFile(file.path, function(err, data) {
      var params = {
        Bucket: config.s3.bucket,
        Key: key,
        Body: data
      };
      s3.upload(params, function(err, data) {
        if (err) {
          log.error("Error with saving to S3.");
          log.error(err);
          return reject(err);
        } else {
          fs.unlink(file.path); // Delete local file.
          log.info("Successful saving to S3.");
          file.key = key;

          model.setDataValue('filename', file.name);
          model.setDataValue('mimeType', file.mimeType);
          model.setDataValue('size', file.size);
          model.setDataValue('fileKey', file.key);
          return resolve(model.save());
        }
      });
    });
  });
}

function geometrySetter(val) {
  // Put here so old apps that send location in a string still work.
  // TODO remove this when nobody is using the old app that sends a string.
  if (typeof val === 'string') return;
  this.setDataValue('location', { type: 'Point', coordinates: val });
}

function addTags(newTags) {
  var model = this;
  return new Promise(function(resolve, reject) {
    // Get current tags, if no tags already make default tag JSON.
    var tags = model.get('tags');
    if (tags === null) tags = { length: 0, nextId: 1 };

    for (var key in newTags) {
      tags[tags.nextId] = newTags[key];
      tags.nextId = tags.nextId + 1;
      tags.length = tags.length + 1;
    }
    model.set('tags', tags);
    model.save().then(() => resolve());
  });
}

function deleteTags(tagsIds) {
  var model = this;
  return new Promise(function(resolve, reject) {
    var tags = model.get('tags');
    if (!tags) resolve();
    for (var id in tagsIds)
      if (id !== 'nextId' || id !== 'length') {
        delete tags[tagsIds[id]];
        tags.length = tags.length - 1;
      }
    model.set('tags', tags);
    model.save().then(() => resolve());
  });
}

exports.geometrySetter = geometrySetter;
exports.saveFile = saveFile;
exports.findAllWithUser = findAllWithUser;
exports.processAudio = processAudio;
exports.processVideo = processVideo;
exports.getFileData = getFileData;
exports.addTags = addTags;
exports.deleteTags = deleteTags;
