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
  var addUserToGroup = async function(authUser, groupId, userToAddId, admin) {
    const group = await this.findById(groupId);
    if (!(await group.userPermissions(authUser)).canAddUsers) {
      return false;
    }

    var userToAdd = await models.User.findById(userToAddId);
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
      return true;
    }

    await group.addUser(userToAdd.id, {admin: admin});
    return true;
  };

  /**
   * Removes a user from a Group, if the given user has permission to do so.
   * The user must be a group admin to do this.
   */
  var removeUserFromGroup = async function(authUser, groupId, userToRemoveId) {
    const group = await this.findById(groupId);
    if (!(await group.userPermissions(authUser)).canRemoveUsers) {
      return false;
    }
    var userToRemove = await models.User.findById(userToRemoveId);
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
    for (var i in groupUsers) {
      await groupUsers[i].destroy();
    }
    return true;
  };

  /**
   * Return one or more groups matching the where condition. Only get groups
   * that the user belongs if not a superuser.
   */
  const query = async function(where, user) {

    var userWhere = null;
    if (!user.superuser) {
      userWhere = { id: user.id };
    }

    return await models.Group.findAll({
      where: where,
      include: [
        {
          model: models.User,
          attributes: ['id', 'username'],
          where: userWhere,
        },
        {
          model: models.Device,
          attributes: ['id', 'devicename'],
        }
      ],
    });
  };

  const userPermissions = async function(user) {
    if (user.superuser) {
      return newUserPermissions(true);
    }
    return newUserPermissions(await models.GroupUsers.isAdmin(this.id, user.id));
  };


  const newUserPermissions = function(enabled) {
    return {
      canAddUsers: enabled,
      canRemoveUsers: enabled,
    };
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields,
      getIdFromName: getIdFromName,
      addUserToGroup: addUserToGroup,
      removeUserFromGroup: removeUserFromGroup,
      query: query,
    },
    instanceMethods: {
      userPermissions: userPermissions,
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
