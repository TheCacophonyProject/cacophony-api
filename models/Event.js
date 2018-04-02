'use strict';
module.exports = function(sequelize, DataTypes) {
  var name = 'Event';

  var attributes = {
    timestamp: DataTypes.DATE
  };

  var options = {
    classMethods: {
      addAssociations: function() {}
    },
  };

  return sequelize.define(name, attributes, options);
};

function addAssociations(models) {
}
