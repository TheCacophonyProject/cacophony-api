var AWS = require('aws-sdk');
var log = require('../../logging');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var mime = require('mime');
var path = require('path');
var config = require('../../cacconfig').config;


function findAllWithUser(model, user, queryParams) {
  return new Promise(function(resolve, reject) {
    var models = require('../');
    if (typeof queryParams.limit == 'undefined') queryParams.limit = 20;
    if (typeof queryParams.offset == 'undefined') queryParams.offset = 0;
    queryParams.order = [
      ['recordingDateTime', 'DESC'],
    ];
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
          queryParams.include = [
            { model: models.Group },
            { model: models.Tag },
          ];
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

function migrationAddBelongsTo(queryInterface, childTable, parentTable, name) {
  var columnName = parentTable.substring(0, parentTable.length - 1) + 'Id';
  if (name)
    columnName = name + 'Id';
  else
    columnName = parentTable.substring(0, parentTable.length - 1) + 'Id';
  var constraintName = childTable + '_' + columnName + '_fkey';
  return new Promise(function(resolve, reject) {
    queryInterface.sequelize.query(
        'ALTER TABLE "' + childTable +
        '" ADD COLUMN "' + columnName +
        '" INTEGER;'
      )
      .then(() => {
        return queryInterface.sequelize.query(
          'ALTER TABLE "' + childTable +
          '" ADD CONSTRAINT "' + constraintName +
          '" FOREIGN KEY ("' + columnName +
          '") REFERENCES "' + parentTable +
          '" (id) ON DELETE SET NULL ON UPDATE CASCADE;');
      })
      .then(() => resolve())
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}

function migrationRemoveBelongsTo(queryInterface, childTable, parentTable) {
  var columnName = parentTable.substring(0, parentTable.length - 1) + 'Id';
  return queryInterface.sequelize.query(
    'ALTER TABLE "' + childTable +
    '" DROP COLUMN "' + columnName + '";'
  );
}

function belongsToMany(queryInterface, viaTable, table1, table2) {
  var columnName1 = table1.substring(0, table1.length - 1) + 'Id';
  var constraintName1 = viaTable + '_' + columnName1 + '_fkey';
  var columnName2 = table2.substring(0, table2.length - 1) + 'Id';
  var constraintName2 = viaTable + '_' + columnName2 + '_fkey';
  console.log('Adding belongs to many columns.');
  return new Promise(function(resolve, reject) {
    Promise.all([
        queryInterface.sequelize.query(
          'ALTER TABLE "' + viaTable +
          '" ADD COLUMN "' + columnName1 +
          '" INTEGER;'
        ),
        queryInterface.sequelize.query(
          'ALTER TABLE "' + viaTable +
          '" ADD COLUMN "' + columnName2 +
          '" INTEGER;'
        ),
      ]).then(() => {
        console.log('Adding belongs to many constraint.');
        return Promise.all([
          queryInterface.sequelize.query(
            'ALTER TABLE "' + viaTable +
            '" ADD CONSTRAINT "' + constraintName1 +
            '" FOREIGN KEY ("' + columnName1 +
            '") REFERENCES "' + table1 +
            '" (id) ON DELETE CASCADE ON UPDATE CASCADE;'),
          queryInterface.sequelize.query(
            'ALTER TABLE "' + viaTable +
            '" ADD CONSTRAINT "' + constraintName2 +
            '" FOREIGN KEY ("' + columnName2 +
            '") REFERENCES "' + table2 +
            '" (id) ON DELETE CASCADE ON UPDATE CASCADE;'),
        ]);
      })
      .then(() => resolve())
      .catch((err) => reject(err));
  });
}

function addSerial(queryInterface, tableName) {
  return queryInterface.sequelize.query(
    'ALTER TABLE "' + tableName +
    '" ADD COLUMN id SERIAL PRIMARY KEY;'
  );
}

function getFromId(id, user, attributes) {
  var modelClass = this;
  return new Promise((resolve, reject) => {
    // Get just public models if no user was given
    if (!user)
      return modelClass
        .findOne({ where: { id: id, public: true } })
        .then(resolve);

    user
      .getGroupsIds()
      .then(ids => {
        // Condition where you get a public recordin or a recording that you
        // have permission to view (in same group).
        var condition = {
          where: {
            id: id,
            "$or": [{ GroupId: { "$in": ids } }, { public: true }],
          },
          attributes: attributes,
        };
        return modelClass.findOne(condition);
      })
      .then(resolve);
  });
}

/**
 * Deletes the deleteModelInstance and the file attached to the model with the
 * given id.
 * A promise is returned that will resolve if successful and reject if failed
 * to delete the file and modelInstance.
 */
function deleteModelInstance(id, user) {
  var modelClass = this;
  var modelInstance = null;
  return new Promise((resolve, reject) => {
    modelClass
      .getFromId(id, user, ['fileKey', 'id'])
      .then(mi => {
        modelInstance = mi;
        if (modelInstance === null)
          throw {badRequest: 'No file found'};
        return modelInstance.fileKey;
      })
      .then(fileKey => deleteFile(fileKey))
      .then(() => modelInstance.destroy())
      .then(resolve)
      .catch(reject);
  });
}

function userCanEdit(id, user) {
  var modelClass = this;
  var modelInstance = null;
  return new Promise((resolve, reject) => {
    //models.User.where
    modelClass
      .getFromId(id, user, ['id'])
      .then(result => {
        if (result === null)
          return resolve(false);
        else
          return resolve(true);
      })
  });
}

function openS3() {
    return new AWS.S3({
      endpoint: config.s3.endpoint,
      accessKeyId: config.s3.publicKey,
      secretAccessKey: config.s3.privateKey,
      s3ForcePathStyle: true, // needed for minio
    });
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

    // Save file with key.
    var s3 = openS3();
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

function deleteFile(fileKey) {
  return new Promise((resolve, reject) => {
    var s3 = openS3();
    var params = {
      Bucket: config.s3.bucket,
      Key: fileKey,
    };
    s3.deleteObject(params, function(err, data) {
      if (err) return reject(err);
      else return resolve(data);
    });
  });
}

exports.geometrySetter = geometrySetter;
exports.findAllWithUser = findAllWithUser;
exports.processAudio = processAudio;
exports.processVideo = processVideo;
exports.getFileData = getFileData;
exports.addTags = addTags;
exports.deleteTags = deleteTags;
exports.migrationAddBelongsTo = migrationAddBelongsTo;
exports.migrationRemoveBelongsTo = migrationRemoveBelongsTo;
exports.belongsToMany = belongsToMany;
exports.addSerial = addSerial;
exports.getFromId = getFromId;
exports.deleteModelInstance = deleteModelInstance;
exports.userCanEdit = userCanEdit;
exports.openS3 = openS3;
exports.saveFile = saveFile;
