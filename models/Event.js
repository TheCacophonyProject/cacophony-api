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

"use strict";

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function(sequelize, DataTypes) {
  const name = "Event";

  const attributes = {
    dateTime: DataTypes.DATE
  };

  const Event = sequelize.define(name, attributes);

  //---------------
  // CLASS METHODS
  //---------------
  const models = sequelize.models;

  Event.addAssociations = function(models) {
    models.Event.belongsTo(models.DetailSnapshot, {
      as: "EventDetail",
      foreignKey: "EventDetailId"
    });
  };

  /**
   * Return one or more recordings for a user matching the query
   * arguments given.
   */
  Event.query = async function(
    user,
    startTime,
    endTime,
    deviceId,
    offset,
    limit
  ) {
    const where = {};

    if (startTime || endTime) {
      const dateTime = (where.dateTime = {});
      if (startTime) {
        dateTime[Op.gte] = startTime;
      }
      if (endTime) {
        dateTime[Op.lt] = endTime;
      }
    }

    if (deviceId) {
      where.DeviceId = deviceId;
    }

    return this.findAndCountAll({
      where: {
        [Op.and]: [
          where, // User query
          await user.getWhereDeviceVisible() // can only see devices they should
        ]
      },
      order: ["dateTime"],
      include: {
        model: models.DetailSnapshot,
        as: "EventDetail",
        attributes: ["type", "details"]
      },
      attributes: { exclude: ["updatedAt", "EventDetailId"] },
      limit: limit,
      offset: offset
    });
  };

  return Event;
};
