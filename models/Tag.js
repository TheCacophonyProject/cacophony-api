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

const util = require("./util/util");
const _ = require("lodash");

module.exports = function(sequelize, DataTypes) {
  const name = "Tag";

  const attributes = {
    what: {
      type: DataTypes.STRING
    },
    detail: {
      type: DataTypes.STRING
    },
    confidence: {
      // 0: Not sure at all; 1: 100% positive
      type: DataTypes.FLOAT
    },
    startTime: {
      // Start time of the tag in the linked recording in seconds
      type: DataTypes.FLOAT
    },
    duration: {
      // duration of the tag
      type: DataTypes.FLOAT
    },
    automatic: {
      // True if the tag was automatically generated.
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0x0100
    }
  };

  const Tag = sequelize.define(name, attributes);

  //---------------
  // CLASS METHODS
  //---------------
  const Recording = sequelize.models.Recording;

  Tag.buildSafely = function(fields) {
    return Tag.build(_.pick(fields, Tag.apiSettableFields));
  };

  Tag.addAssociations = function(models) {
    models.Tag.belongsTo(models.User, { as: "tagger" });
    models.Tag.belongsTo(models.Recording);
  };

  Tag.getFromId = function(id, user, attributes) {
    util.GetFromId(id, user, attributes);
  };

  Tag.deleteModelInstance = function(id, user) {
    util.deleteModelInstance(id, user);
  };

  Tag.deleteFromId = async function(id, user) {
    const tag = await this.findOne({ where: { id: id } });
    if (tag == null) {
      return true;
    }
    const recording = await Recording.get(
      user,
      tag.RecordingId,
      Recording.Perms.TAG
    );

    if (recording == null) {
      return false;
    }

    await tag.destroy();
    return true;
  };

  Tag.userGetAttributes = Object.freeze([
    "id",
    "what",
    "detail",
    "confidence",
    "startTime",
    "duration",
    "automatic",
    "version",
    "createdAt"
  ]);

  Tag.apiSettableFields = Object.freeze([
    "what",
    "detail",
    "confidence",
    "startTime",
    "duration",
    "automatic",
    "version"
  ]);

  return Tag;
};
