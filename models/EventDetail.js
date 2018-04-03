module.exports = function(sequelize, DataTypes) {
  var name = 'EventDetail';

  var attributes = {
    type: DataTypes.STRING,
    details: DataTypes.JSONB
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
      getMatching: getMatching,
    },
  };

  return sequelize.define(name, attributes, options);
};

function addAssociations(models) {
  models.EventDetail.hasMany(models.Event);
}

const getMatching = async function(searchType, searchDetails) {
  return await this.findOne({ where: {
    type: searchType,
    details: searchDetails,
  }});
};

