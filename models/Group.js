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
   * that the user belongs if user does not have global read/write permission.
   */
  const query = async function(where, user) {

    var userWhere = { id: user.id };
    if (['read', 'write'].includes(user.globalPermission)) {
      userWhere = null;
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
      ]
    }).then(groups => {

      // TODO: Review the following with a mind to combining with the groups.findAll query to improve efficiency
      const augmentGroupData = new Promise((resolve,reject) => {
        try {
          const groupsPromises = groups.map(group => {

            return models.User.findAll({
              attributes:['username','id'],
              include:[
                {
                  model:models.Group,
                  where:{
                    id:group.id
                  },
                  attributes:[]
                }
              ]
            }).then(async groupUsers => {

              const setAdminPromises = groupUsers.map(groupUser => {
                return models.GroupUsers.isAdmin(group.id, groupUser.id).then(value => {
                  groupUser.setDataValue("isAdmin", value);
                });
              });

              await Promise.all(setAdminPromises);

              group.setDataValue('GroupUsers',groupUsers);
              return group;
            });
          });

          Promise.all(groupsPromises).then(data => {
            resolve(data);
          });

        } catch (e) {
          reject(e);
        }
      });

      return augmentGroupData.then(groupData => {
        return groupData;
      });

    });
  };

  const userPermissions = async function(user) {
    if (user.globalPermission == 'write') {
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

  const getFromId = async function(id) {
    return await this.findById(id);
  };

  const getFromName = async function(name) {
    return await this.findOne({ where: { groupname: name }});
  };

  const freeGroupname = async function(name) {
    var group = await this.findOne({where: { groupname: name }});
    if (group != null) {
      throw new Error('groupname in use');
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
      query: query,
      getFromId: getFromId,
      getFromName: getFromName,
      freeGroupname: freeGroupname,
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
  return new Promise(function(resolve) {
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
  models.Group.belongsToMany(models.User, { through: models.GroupUsers });
  models.Group.hasMany(models.Recording);
}
