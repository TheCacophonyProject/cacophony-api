/*
cacophony-api: The Cacophony Project API server
Copyright (C) 2018  The Cacophony Project

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';
module.exports = function(sequelize, DataTypes) {
  var name = 'Event';

  var attributes = {
    dateTime: DataTypes.DATE,
  };

  
  var options = {
  };

  var Event = sequelize.define(name, attributes, options);

  //---------------
  // CLASS METHODS
  //---------------
  var models = sequelize.models;

  /* .. */
  Event.addAssociations = function(models) {
    models.Event.belongsTo(models.EventDetail);
  }
  
  /**
  * Return one or more recordings for a user matching the query
  * arguments given.
  */
  Event.query = async function(user, where, offset, limit, order) {
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
          await user.getWhereDeviceVisible(), // can only see devices they should
        ],
      },
      order: order,
      include: [
        { model: models.EventDetail, attributes: ['type', 'details'] },
      ],
      attributes: { exclude : ['updatedAt'] },
      limit: limit,
      offset: offset,
    };
    return this.findAndCount(q);
  };

  return Event;
};
