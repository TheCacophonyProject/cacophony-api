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
      apiSettableFields: apiSettableFields
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
