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

var Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function(sequelize, DataTypes) {
  var name = "DetailSnapshot";

  var attributes = {
    type: DataTypes.STRING,
    details: DataTypes.JSONB
  };

  var options = {};

  var DetailSnapshot = sequelize.define(name, attributes, options);

  //---------------
  // CLASS METHODS
  //---------------

  DetailSnapshot.addAssociations = function(models) {
    models.DetailSnapshot.hasMany(models.Event, {
      foreignKey: "EventDetailId"
    });
    models.DetailSnapshot.hasMany(models.Track, { foreignKey: "AlgorithmId" });
  };

  DetailSnapshot.getOrCreateMatching = async function(
    searchType,
    searchDetails
  ) {
    if (!searchDetails) {
      searchDetails = {
        [Op.eq]: null
      };
    }

    const existing = await this.findOne({
      where: {
        type: searchType,
        details: searchDetails
      }
    });

    if (existing) {
      return existing;
    } else {
      return await this.create({
        type: searchType,
        details: searchDetails
      });
    }
  };

  DetailSnapshot.getFromId = async function(id) {
    return await this.findById(id);
  };

  return DetailSnapshot;
};
