module.exports = function(sequelize, DataTypes) {
  // Define table
  return sequelize.define("Group", {
    name: DataTypes.STRING,     //TODO limit len of this
  }, {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields
    }
  })
}

var apiSettableFields = [];

function addAssociations(models) {
  models.Group.belongsToMany(models.User, {through: 'UserGroup'});
  models.Group.hasMany(models.Device);
  models.Group.hasMany(models.IrVideoRecording);
  models.Group.hasMany(models.User, {as: 'Admins'});
}
