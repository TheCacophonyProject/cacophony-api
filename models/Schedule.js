'use strict';
module.exports = function(sequelize, DataTypes) {
  var name = 'Schedule';

  var attributes = {
    schedule: DataTypes.JSONB
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
    },
  };

  return sequelize.define(name, attributes, options);
};

function addAssociations(models) {
  models.File.belongsTo(models.User);
}