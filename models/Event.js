'use strict';
module.exports = function(sequelize, DataTypes) {
  var name = 'Event';

  var attributes = {
    dateTime: DataTypes.DATE,
  };

  var options = {
    classMethods: {
      addAssociations: function addAssociations() {},
    },
  };

  return sequelize.define(name, attributes, options);
};
