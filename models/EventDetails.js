module.exports = function(sequelize, DataTypes) {
  var name = 'EventDetails';

  var attributes = {
    type: DataTypes.STRING,
    details: DataTypes.JSONB
  };

  var options = {
    classMethods: {
      addAssociations: function() {}
    },
  };

  return sequelize.define(name, attributes, options);
};
