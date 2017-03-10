module.exports = function(sequelize, DataTypes) {
  var name = 'Group';

  var attributes = {
    groupname: {
      type: DataTypes.STRING,
    },
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields,
      getIdFromName: getIdFromName
    }
  };

  return sequelize.define(name, attributes, options);
};

var apiSettableFields = [];

function getIdFromName(name) {
  var Group = this;
  return new Promise(function(resolve, reject) {
    Group.findOne({ where: { groupname: name } })
      .then(function(group) {
        if (!group) {
          resolve(false);
        } else {
          resolve(group.getDataValue('id'));
        }
      });
  });
}

function addAssociations(models) {
  models.Group.hasMany(models.Device);
  models.Group.hasMany(models.IrVideoRecording);
  models.Group.hasMany(models.AudioRecording);
  models.Group.hasMany(models.ThermalVideoRecording);
  models.Group.belongsToMany(models.User, { through: models.GroupUsers });
}
