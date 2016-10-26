var models = require('./')

var Group;

module.exports = function(sequelize, DataTypes) {
  // Define table
  Group = sequelize.define("Group", {
    name: DataTypes.STRING, //TODO limit len of this
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
    Group.findOne({ where: { name: name } })
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
  models.Group.belongsToMany(models.User, { through: 'UserGroup' });
  models.Group.hasMany(models.Device);
  models.Group.hasMany(models.IrVideoRecording);
  models.Group.hasMany(models.AudioRecording);
  models.Group.hasMany(models.User, { as: 'Admins' });
}
