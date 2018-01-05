module.exports = function(sequelize, DataTypes) {
  var name = 'DeviceUsers';

  var attributes = {
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  };

  const isAdmin = async function(deviceId, userId) {
    var deviceUser = await this.findOne({
      where: {
        DeviceId: deviceId,
        UserId: userId,
        admin: true,
      }
    });
    return deviceUser != null;
  };

  var options = {
    classMethods: {
      isAdmin: isAdmin,
      addAssociations: function() {}
    },
  };

  return sequelize.define(name, attributes, options);
};
