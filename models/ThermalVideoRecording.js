module.exports = function(sequelize, DataTypes) {
  // Define table
  return sequelize.define("ThermalVideoRecording", {
    recordingDateTime: DataTypes.DATE,
    fileUri: DataTypes.STRING,
    recordingTime: DataTypes.TIME,
    fileType: DataTypes.STRING,
    fps: DataTypes.INTEGER,
    size: DataTypes.INTEGER,
    duration: DataTypes.INTEGER,
    resx: DataTypes.INTEGER,
    resy: DataTypes.INTEGER,
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
    }
  }, {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields
    }
  })
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
]

function addAssociations(models) {

}
