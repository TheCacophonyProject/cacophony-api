module.exports = function(sequelize, DataTypes) {
  var name = 'GroupUsers';

  var attributes = {
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  };

  /**
   * Checks if a user is a admin of a group.
   */
  var isAdmin = async function(groupId, userId) {
    var groupUsers = await this.findOne({
      where: {
        GroupId: groupId,
        UserId: userId,
        admin: true,
      }
    });
    return groupUsers != null;
  };

  var options = {
    classMethods: {
      isAdmin: isAdmin,
    },
  };

  return sequelize.define(name, attributes, options);
};
