var util = require('./util');

module.exports = function(sequelize, DataTypes) {
  // Define table
  var IrVideoRecording = sequelize.define("IrVideoRecording", {
    recordingDateTime: { // Datetime stamp of when the recording started in ISO 8601 format.
      type: DataTypes.DATE
    },
    fileUrl: { // Location of the recording file.
      type: DataTypes.STRING,
    },
    recordingTime: { // Timestamp of when the recording started. Just time without timezone.
      type: DataTypes.TIME,
    },
    fileType: { // MIME file type of the recording. //TODO make this an ENUM.
      type: DataTypes.STRING
    },
    fps: { // FPS of the recording.
      type: DataTypes.INTEGER
    },
    size: { // Size in KB of the recording.
      type: DataTypes.INTEGER,
    },
    duration: { // Duration in seconds of the recording.
      type: DataTypes.INTEGER
    },
    resx: { // Resolution width.
      type: DataTypes.INTEGER
    },
    resy: { // Resolution height.
      type: DataTypes.INTEGER
    },
    location: { // Location of the device when the recording was taken. //TODO put this into three fields, latitude, longitude and height.
      type: DataTypes.STRING
    },
    locationDatetime: { // Datetime of when the location data was recorded.
      type: DataTypes.DATE
    },
    aditionalMetadata: { // JSON of addition metadata that is not included in the other fields.
      type: DataTypes.JSONB
    },
    tags: { type: DataTypes.JSONB },
    filtered: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    filterMetadata: { type: DataTypes.JSONB },
    passedFilter: { type: DataTypes.BOOLEAN },
    public: { type: DataTypes.BOOLEAN }
  }, {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields,
      findAllWithUser: findAllWithUser
    },
    instanceMethods: {
      getFrontendFields: getFrontendFields,
      uploadFileSuccess: uploadFileSuccess,
      processRecording: util.processVideo,
    }
  });
  return IrVideoRecording;
};

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
    fileUrl: model.getDataValue('fileUrl'),
    deviceId: model.getDataValue('DeviceId'),
    groupId: model.getDataValue('GroupId'),
    group: group
  };
}

function uploadFileSuccess(res) {
  this.setDataValue('fileUrl', res.req.url);
  this.save();
}

// Fields that are directly settable by the user when uploading.
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
  'locationDatetime',
  'aditionalMetadata',
  'tags'
];

function addAssociations(models) {
  models.IrVideoRecording.belongsTo(models.Group);
}

function findAllWithUser(user, queryParams) {
  return util.findAllWithUser(this, user, queryParams);
}
