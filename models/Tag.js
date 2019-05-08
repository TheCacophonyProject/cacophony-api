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

var util = require('./util/util');
const { AuthorizationError } = require("../api/customErrors");

module.exports = function(sequelize, DataTypes) {
  var name = 'Tag';

  var attributes = {

    animal: { // Name of animal for the Tag
      type: DataTypes.STRING,
    },
    event: {
      type: DataTypes.STRING,
    },
    confidence: { // 0-Not sure at all, 1-100% positive.
      type: DataTypes.FLOAT,
    },
    startTime: { // Start time of the tag in the linked recording in seconds
      type: DataTypes.FLOAT,
    },
    duration: { // duration of the tag
      type: DataTypes.FLOAT,
    },
    number: { // Number of animals in tag
      type: DataTypes.INTEGER,
    },
    trapType: {
      type: DataTypes.STRING,
    },
    sex: { // What sex is the animal, null if don't know.
      type: DataTypes.ENUM('F', 'M'),
    },
    age: { // Guessed age in weeks of animal
      type: DataTypes.INTEGER,
    },
    automatic: { // True if the tag was automatically generated.
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  };

  var Tag = sequelize.define(name, attributes);

  //---------------
  // CLASS METHODS
  //---------------
  const Recording = sequelize.models.Recording;

  Tag.addAssociations = function(models) {
    models.Tag.belongsTo(models.User, {as: 'tagger'});
    models.Tag.belongsTo(models.Recording);
  };
  
  Tag.getFromId = function(id, user, attributes) {
    util.GetFromId(id, user, attributes);
  };
  
  Tag.deleteModelInstance = function(id, user) {
    util.deleteModelInstance(id, user);
  };

  Tag.deleteFromId = async function(id, user) {
    var tag = await this.findOne({where: {id: id}});
    if (tag == null) {
      return false;
    }
    const recording = await Recording.get(
      user,
      tag.RecordingId,
      Recording.Perms.TAG,
    );

    if(recording == null){
      return false
    }
    return tag.destroy();
  };
  
  Tag.prototype.getFrontendFields = function() {
    var model = this;
    return {
      id: model.getDataValue('id'),
      animal: model.getDataValue('animal'),
      confidence: model.getDataValue('confidence'),
      startTime: model.getDataValue('startTime'),
      duration: model.getDataValue('duration'),
      number: model.getDataValue('number'),
      trapType: model.getDataValue('trapType'),
      event: model.getDataValue('event'),
      sex: model.getDataValue('sex'),
      age: model.getDataValue('age'),
    };
  };
  
  Tag.apiUpdateableFields = [];
  
  Tag.apiSettableFields = [
    'animal',
    'confidence',
    'startTime',
    'duration',
    'number',
    'trapType',
    'event',
    'sex',
    'age',
    'automatic',
  ];
  
  return Tag;
};
