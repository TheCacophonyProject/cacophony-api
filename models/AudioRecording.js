module.exports = function(sequelize, DataTypes) {
  // Define table
  return sequelize.define("AudioRecording", {
    recordingDateTime: DataTypes.DATE,
    fileUrl: DataTypes.STRING,
    recordingTime: DataTypes.TIME,
    fileType: DataTypes.STRING,
    size: DataTypes.INTEGER,
    duration: DataTypes.INTEGER,
    location: DataTypes.STRING,   //TODO add geometry
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
    }
  })
}

var apiSettableFields = [
  'recordingDateTime',
  'recordingTime',
  'fileType',
  'size',
  'duration',
  'location',
  'additionalMetadata',
  'tags'
]

function addAssociations(models) {

}

function getFrontendFields() {
  var model = this;
  return {
    id: model.getDataValue('id'),
    recordingDateTime: model.getDataValue('recordingDateTime'),
    recordingTime: model.getDataValue('recordingTime'),
    duration: model.getDataValue('duration'),
    location: model.getDataValue('location'),
    tags: model.getDataValue('tags'),
    fileUrl: model.getDataValue('fileUrl'),
    deviceId: model.getDataValue('DeviceId'),
    groupId: model.getDataValue('GroupId')
  }
}

function findAllWithUser(user, queryParams) {
  //var model = this;
  // Find what devices the user can see.
  //
  var models = require('./');
  if (!user) {
    return models.AudioRecording.findAll({
      where: { "$and": [queryParams.where, { public: true }] }
    })
  } else {
    return models.User.findOne({ where: user.id }) //TODO find a better way do deal with the require.
      .then(function(user) {
        return user.getGroupsIds();
      })
      .then(function(ids) {
        console.log(ids);
        queryParams.where = {
          "$and": [
            queryParams.where,
            { "$or": [{ public: true }, { GroupId: { "$in": ids } }] }
          ]
        }
        return models.IrVideoRecording.findAll(queryParams)
      })
  }
}
