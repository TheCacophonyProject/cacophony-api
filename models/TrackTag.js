/*
cacophony-api: The Cacophony Project API server
Copyright (C) 2019  The Cacophony Project

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

module.exports = function(sequelize, DataTypes) {
  const TrackTag = sequelize.define("TrackTag", {
    what: DataTypes.STRING,
    confidence: DataTypes.FLOAT,
    automatic: DataTypes.BOOLEAN,
    data: DataTypes.JSONB
  });

  //---------------
  // CLASS METHODS
  //---------------
  TrackTag.addAssociations = function(models) {
    models.TrackTag.belongsTo(models.Track);
    models.TrackTag.belongsTo(models.User);
  };

  TrackTag.apiSettableFields = Object.freeze(["what", "confidence", "data"]);

  TrackTag.userGetAttributes = Object.freeze(
    TrackTag.apiSettableFields.concat(["id"])
  );

  return TrackTag;
};
