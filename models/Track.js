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
  const Track = sequelize.define("Track", {
    data: DataTypes.JSONB,
    archivedAt: DataTypes.DATE
  });

  //---------------
  // CLASS
  //---------------
  Track.addAssociations = function(models) {
    models.Track.belongsTo(models.Recording);
    models.Track.belongsTo(models.DetailSnapshot, {
      as: "Algorithm",
      foreignKey: "AlgorithmId"
    });
    models.Track.hasMany(models.TrackTag);
  };

  const models = sequelize.models;

  Track.apiSettableFields = Object.freeze(["algorithm", "data", "archivedAt"]);

  Track.userGetAttributes = Object.freeze(
    Track.apiSettableFields.concat(["id"])
  );

  //---------------
  // INSTANCE
  //---------------

  // Return a specific track tag for the track.
  Track.prototype.getTrackTag = async function(trackTagId) {
    const trackTag = await models.TrackTag.findByPk(trackTagId);
    if (!trackTag) {
      return null;
    }

    // Ensure track tag belongs to this track.
    if (trackTag.TrackId !== this.id) {
      return null;
    }

    return trackTag;
  };

  return Track;
};
