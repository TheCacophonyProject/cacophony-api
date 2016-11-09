module.exports = function(sequelize, DataTypes) {
  // Define table
  return sequelize.define("ThermalVideoRecording", {
    recordingDateTime: DataTypes.DATE,
    fileUrl: DataTypes.STRING,
    recordingTime: DataTypes.TIME,
    fileType: DataTypes.STRING,
    fps: DataTypes.INTEGER,
    size: DataTypes.INTEGER,
    duration: DataTypes.INTEGER,
    resx: DataTypes.INTEGER,
    resy: DataTypes.INTEGER,
    location: DataTypes.STRING, //TODO add geometry
    aditionalMetadata: DataTypes.JSONB,
    tags: DataTypes.JSONB,
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
      findAllWithUser: findAllWithUser
    },
    instanceMethods: {
      getFrontendFields: getFrontendFields,
      uploadFileSuccess: uploadFileSuccess
    }
  });
};

function uploadFileSuccess(res) {
  this.setDataValue('fileUrl', res.req.url);
  this.save();
}

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
  'tags'
];

function findAllWithUser(user, queryParams) {
  //var model = this;
  // Find what devices the user can see.
  //
  var models = require('./');
  if (!user) {
    return models.ThermalVideoRecording.findAll({
      where: { "$and": [queryParams.where, { public: true }] },
      include: [models.Group]
    });
  } else {
    return models.User.findOne({ where: user.id }) //TODO find a better way do deal with the require.
      .then(function(user) {
        return user.getGroupsIds();
      })
      .then(function(ids) {
        queryParams.where = {
          "$and": [
            queryParams.where,
            { "$or": [{ public: true }, { GroupId: { "$in": ids } }] }
          ]
        };
        queryParams.include = [models.Group];
        return models.ThermalVideoRecording.findAll(queryParams);
      });
  }
}

function addAssociations(models) {
  models.ThermalVideoRecording.belongsTo(models.Group);
}
