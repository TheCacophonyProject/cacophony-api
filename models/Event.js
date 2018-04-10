'use strict';
module.exports = function(sequelize, DataTypes) {
  var name = 'Event';

  var attributes = {
    dateTime: DataTypes.DATE,
  };

  var models = sequelize.models;

  /**
    * Return one or more recordings for a user matching the query
    * arguments given.
    */
   var query = async function(user, where, offset, limit, order) {
    if (order == null) {
      order = [
        // Sort by recordingDatetime but handle the case of the
        // timestamp being missing and fallback to sorting by id.
        [sequelize.fn("COALESCE", sequelize.col('dateTime'), '1970-01-01'), "DESC"],
        ["id", "DESC"],
      ];
    }

    var q = {
      where: {
        "$and": [
          where, // User query
          await user.getVisibleDevicesConstaint(), // can only see devices they should
        ],
      },
      order: order,
      include: [
        { model: models.EventDetail },
      ],
      limit: limit,
      offset: offset,
    };
    return this.findAndCount(q);
  };

  var options = {
    classMethods: {
      query: query,
      addAssociations: addAssociations,
    },
  };


  return sequelize.define(name, attributes, options);
};


function addAssociations(models) {
  models.Event.belongsTo(models.EventDetail);
}
