module.exports = function(sequelize, DataTypes) {
  var name = 'Group';

  var attributes = {
    groupname: {
      type: DataTypes.STRING,
    },
  };

  var models = sequelize.models;

  /**
   * Adds a user to a Group, if the given user has permission to do so.
   * The user must be a group admin to do this.
   */
  var addUserToGroup = async function(groupAdmin, groupId, userToAddId, admin) {
    // Return false if the user doesn't have permission.
    if (!groupAdmin.superuser && !models.GroupUsers.isAdmin(groupId, groupAdmin.id)) {
      return false;
    }

    var userToAdd = await models.User.findById(userToAddId);
    var group = await this.findById(groupId);

    if (userToAdd == null || group == null) {
      return false;
    }

    // Get association if already there and update it.
    var groupUser = await models.GroupUsers.findOne({
      where: {
        GroupId: groupId,
        UserId: userToAdd.id,
      }
    });
    if (groupUser != null) {
      groupUser.admin = admin; // Update admin value.
      await groupUser.save();
      console.log('Updated');
      return true;
    }

    await group.addUser(userToAdd.id, {admin: admin});
    return true;
  };

  /**
   * Removes a user from a Group, if the given user has permission to do so.
   * The user must be a group admin to do this.
   */
  var removeUserFromGroup = async function(groupAdmin, groupId, userToRemoveId) {
    // Return false if the user doesn't have permission.
    if (!groupAdmin.superuser && !models.GroupUsers.isAdmin(groupId, groupAdmin.id)) {
      return false;
    }

    var userToRemove = await models.User.findById(userToRemoveId);
    var group = await this.findById(groupId);

    if (userToRemove == null || group == null) {
      return false;
    }

    // Get association if already there and update it.
    var groupUsers = await models.GroupUsers.findAll({
      where: {
        GroupId: groupId,
        UserId: userToRemove.id,
      }
    });
    if (groupUsers.length == 0) {
      return false;
    }
    for (var i in groupUsers) {
      await groupUsers[i].destroy();
    }
    return true;
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields,
      getIdFromName: getIdFromName,
      addUserToGroup: addUserToGroup,
      removeUserFromGroup: removeUserFromGroup,
    },
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
  models.Group.hasMany(models.Recording);
}
