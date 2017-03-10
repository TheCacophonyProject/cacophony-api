module.exports = function(sequelize, DataTypes) {
  var name = 'GroupUsers';

  var attributes = {
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
    },
  };

  return sequelize.define(name, attributes, options);
};

function addAssociations(models) {
}
