var util = require('./util');
var validation = require('./validation');

module.exports = function(sequelize, DataTypes) {
  // Define table
  return sequelize.define("ThermalVideoRecording", {
    recordingDateTime: DataTypes.DATE,
    fileKey: DataTypes.STRING,
    mimeType: DataTypes.STRING,
    recordingTime: DataTypes.TIME,
    fps: DataTypes.INTEGER,
    size: DataTypes.INTEGER,
    duration: DataTypes.INTEGER,
    resx: DataTypes.INTEGER,
    resy: DataTypes.INTEGER,
    aditionalMetadata: DataTypes.JSONB,
    tags: DataTypes.JSONB,
    batteryCharging: DataTypes.STRING,
    batteryLevel: DataTypes.DOUBLE,
    airplaneModeOn: DataTypes.BOOLEAN,
    location: {
      type: DataTypes.GEOMETRY,
      set: util.geometrySetter,
      validate: { isLatLon: validation.isLatLon },
    },
    filtered: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    filterMetadata: {
      type: DataTypes.JSONB
    },
    passedFilter: {
      type: DataTypes.BOOLEAN
    },
    public: { type: DataTypes.BOOLEAN }
  }, {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields,
      findAllWithUser: findAllWithUser,
      getFileData: getFileData,
      apiUpdateableFields: apiUpdateableFields,
    },
    instanceMethods: {
      getFrontendFields: getFrontendFields,
      processRecording: util.processVideo,
      saveFile: util.saveFile,
    }
  });
};

var apiUpdateableFields = [
  'recordingDateTime',
  'recordingTime',
  'location',
  'additionalMetadata',
];

function getFrontendFields() {
  var model = this;
  var group = null;
  if (model.dataValues.Group) {
    group = model.dataValues.Group.dataValues.groupname;
  }
  return {
    id: model.getDataValue('id'),
    recordingDateTime: model.getDataValue('recordingDateTime'),
    recordingTime: model.getDataValue('recordingTime'),
    duration: model.getDataValue('duration'),
    location: model.getDataValue('location'),
    tags: model.getDataValue('tags'),
    fileKey: model.getDataValue('fileKey'),
    batteryCharging: model.get('batteryCharging'),
    batteryLevel: model.get('batteryLevel'),
    airplaneModeOn: model.get('airplaneModeOn'),
    deviceId: model.getDataValue('DeviceId'),
    groupId: model.getDataValue('GroupId'),
    group: group
  };
}

var apiSettableFields = [
  'recordingDateTime',
  'recordingTime',
  'fileType',
  'fps',
  'size',
  'duration',
  'resx',
  'resy',
  'location',
  'additionalMetadata',
  'tags',
  'batteryLevel',
  'batteryCharging',
  'airplaneModeOn',
];

function findAllWithUser(user, queryParams) {
  return util.findAllWithUser(this, user, queryParams);
}

function addAssociations(models) {
  models.ThermalVideoRecording.belongsTo(models.Group);
}

function getFileData(id, user) {
  return util.getFileData(this, id, user);
}
