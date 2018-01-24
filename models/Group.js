module.exports = function(sequelize, DataTypes) {
  var name = 'Group';

  var attributes = {
    groupname: {
      type: DataTypes.STRING,
    },
  };

  const getIdFromName = async function(name) {
    var Group = this;
    return new Promise(function(resolve, reject) {
      console.log(Group);
      Group.findOne({ where: { groupname: name } })
        .then(function(group) {
          if (!group) {
            resolve(false);
          } else {
            resolve(group.getDataValue('id'));
          }
        });
    });
  };

  const getFromId = async function(id) {
    var group = await this.findById(id);
    return group;
  };

  const getFromName = async function(name) {
    var group = this.findOne({ where: {groupname: name }});
    return group;
  };

  const getFromParam = async function(val, {req, location, path}) {
    console.log(val);
    console.log(this);
    var group = null;
    if (path.toLowerCase() == 'group') {
      group = await this.getFromName(val);
    } else if (path.toLowerCase() == 'groupid') {
      group = await this.getFromId(val);
    }
    if (group != null) {
      req[location][path] = group;
      return true;
    } else {
      return false;
    }
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields,
      getIdFromName: getIdFromName,
      getFromParam: getFromParam,
      getFromName: getFromName,
      getFromId: getFromId,
    }
  };

  return sequelize.define(name, attributes, options);
};

var apiSettableFields = [];



function addAssociations(models) {
  models.Group.hasMany(models.Device);
  models.Group.hasMany(models.IrVideoRecording);
  models.Group.hasMany(models.AudioRecording);
  models.Group.hasMany(models.ThermalVideoRecording);
  models.Group.belongsToMany(models.User, { through: models.GroupUsers });
  models.Group.hasMany(models.Recording);
}
