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
      query: query,
    },
  };

  var apiSettableFields = [
    'type',
    'details',
  ];

  /**
  * Return one or more files for a user matching the query
  * arguments given.
  */
  var query = async function(user, where, offset, limit, order) {
    if (order == null) {
      order = [
        ["id", "DESC"],
      ];
    }

    var q = {
      where: where,
      order: order,
      attributes: { exclude : ['updatedAt'] },
      limit: limit,
      offset: offset,
    };
    return this.findAndCount(q);
  };

  return sequelize.define(name, attributes, options);
};


function addAssociations(models) {
  models.File.belongsTo(models.User);
}

