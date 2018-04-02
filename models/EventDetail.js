module.exports = function(sequelize, DataTypes) {
  var name = 'EventDetail';

  var attributes = {
    type: DataTypes.STRING,
    details: DataTypes.JSONB
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
    },
  };

  return sequelize.define(name, attributes, options);
};

function addAssociations(models) {
  models.EventDetail.hasMany(models.Event);
}

