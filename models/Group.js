var models = require('./')

var Group;

module.exports = function(sequelize, DataTypes) {
  // Define table
  Group = sequelize.define("Group", {
    groupname: DataTypes.STRING, //TODO limit len of this
  }, {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields,
      getIdFromName: getIdFromName
    }
  })
  return Group;
}

var apiSettableFields = [];

function getIdFromName(name) {
  return new Promise(function(resolve, reject) {
    Group.findOne({ where: { groupname: name } })
      .then(function(group) {
        if (!group) {
          resolve(false);
        } else {
          resolve(group.getDataValue('id'));
        }
      })
  })
}

function addAssociations(models) {
  models.Group.hasMany(models.Device);
  models.Group.hasMany(models.IrVideoRecording);
  models.Group.hasMany(models.AudioRecording);
  models.Group.hasMany(models.ThermalVideoRecording);
  models.Group.belongsToMany(models.User, { through: models.GroupUsers });
}
