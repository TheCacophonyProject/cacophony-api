var util = require('./util/util');
var validation = require('./util/validation');

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
    },
  };

  return sequelize.define(name, attributes, options);
}

function canGetRaw() {
  if (this.get('type') == 'thermalRaw')
    return true;
  return false;
}

var userGetAttributes = [
  'id',
  'rawFileSize',
  'fileSize',
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
  thermalRaw: ['toOggVideo', 'FINISHED'],
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
