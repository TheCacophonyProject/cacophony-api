module.exports = function(sequelize, DataTypes) {
  var name = 'DeviceUsers';

  var attributes = {
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  };

  var options = {
    classMethods: {
      addAssociations: function() {}
    },
  };

  return sequelize.define(name, attributes, options);
};
