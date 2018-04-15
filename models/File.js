'use strict';
module.exports = function(sequelize, DataTypes) {
  var name = 'File';

  var attributes = {
    type: DataTypes.STRING,
    fileKey: DataTypes.STRING,
    fileSize: DataTypes.STRING,
    details: DataTypes.JSONB
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields,
    },
  };

  var apiSettableFields = [
    'type',
    'details',
  ];

  return sequelize.define(name, attributes, options);
};


function addAssociations(models) {
  models.File.belongsTo(models.User);
}

