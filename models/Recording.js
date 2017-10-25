var util = require('./util/util');
var validation = require('./util/validation');
var moment = require('moment-timezone');
var models = require('./');

module.exports = function(sequelize, DataTypes) {
  var name = 'Recording';

  var attributes = {
    // Raw file data.
    rawFileKey: DataTypes.STRING,
    rawFileSize: DataTypes.INTEGER,
    // Processing fields. Fields set by and for the processing.
    fileKey: DataTypes.STRING,
    fileSize: DataTypes.STRING,
    fileMimeType: DataTypes.STRING,
    processingStartTime: DataTypes.DATE,
    processingMeta: DataTypes.JSONB,
    processingState: DataTypes.STRING,
    passedFilter: DataTypes.BOOLEAN,
    // recording metadata.
    duration: DataTypes.INTEGER,
    recordingDateTime: DataTypes.DATE,
    location: {
      type: DataTypes.GEOMETRY,
      set: util.geometrySetter,
      validate: { isLatLon: validation.isLatLon },
    },
    version: DataTypes.STRING,
    // Battery relevant fields.
    batteryLevel: DataTypes.DOUBLE,
    batteryCharging: DataTypes.STRING,
    airplaneModeOn: DataTypes.BOOLEAN,
    // Other fields
    jobKey: DataTypes.STRING,
    type: DataTypes.STRING,
    public: { type: DataTypes.BOOLEAN, defaultValue: false},
    additionalMetadata: DataTypes.JSONB,
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
      processingAttributes: processingAttributes,
      processingStates: processingStates,
      apiSettableFields: apiSettableFields,
      userGetAttributes: userGetAttributes,
    },
    instanceMethods: {
      canGetRaw: canGetRaw,
      getFileName: getFileName,
      getUserPermissions: getUserPermissions,
    },
  };

  return sequelize.define(name, attributes, options);
}

/**
 * Returns JSON describing what the user can do to the recording.
 * Premission types: DELETE, TAG, VIEW,
 * //TODO This will be edited in the future when recordings can be public.
 */
function getUserPermissions(user) {
  // For now if the user is in the group that owns the recording they have all
  // permission. This will be changed in the future.
  var permissions = {
    canDelete: false,
    canTag: false,
    canView: false,
  }
  var recording = this;
  return new Promise(async (resolve, reject) => {
    var groupIds = await user.getGroupsIds();
    if (groupIds.indexOf(recording.GroupId) !== -1) {
      permissions.canDelete = true;
      permissions.canTag = true;
      permissions.canView = true;
    }
    return resolve(permissions);
  });
}

function canGetRaw() {
  if (this.get('type') == 'thermalRaw')
    return true;
  return false;
}

function getFileName() {
  var ext = "";
  if (this.fileMimeType == 'video/mp4') ext = ".mp4"
  return moment(new Date(this.recordingDateTime)).tz("Pacific/Auckland")
    .format("YYYYMMDD-HHmmss") + ext;
}

var userGetAttributes = [
  'id',
  'rawFileSize',
  'fileSize',
  'fileMimeType',
  'processingState',
  'duration',
  'recordingDateTime',
  'location',
  'version',
  'batteryLevel',
  'batteryCharging',
  'airplaneModeOn',
  'type',
  'additionalMetadata',
  'GroupId',
  'fileKey'
];

var apiSettableFields = [
  'type',
  'duration',
  'recordingDateTime',
  'location',
  'version',
  'batteryCharging',
  'batteryLevel',
  'airplaneModeOn',
  'additionalMetadata',
  'processingMeta',
];

var processingStates = {
  thermalRaw: ['toMp4', 'FINISHED'],
}

var processingAttributes = [
  'id',
  'rawFileKey',
  'fileKey',
  'processingMeta',
  'processingState',
  'jobKey',
  'type',
];

function addAssociations(models) {
  models.Recording.belongsTo(models.Group);
  models.Recording.belongsTo(models.Device);
  models.Recording.hasMany(models.Tag);
}
