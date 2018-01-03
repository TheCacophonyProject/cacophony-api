var util = require('./util/util');
var validation = require('./util/validation');

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
      type: DataTypes.INTEGER
    },
    automatic: { //
      type: DataTypes.BOOLEAN
    },
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields,
      apiUpdateableFields: apiUpdateableFields,
      getFromId: util.getFromId,
      deleteModelInstance: util.deleteModelInstance,
      deleteFromId: deleteFromId,
    },
    instanceMethods: {
      getFrontendFields: getFrontendFields,
    }
  };

  return sequelize.define(name, attributes, options);
};

async function deleteFromId(id, user) {
  var tag = await this.findOne({where: {id: id}});
  if (tag == null) {
    return false;
  }
  if (tag.taggerId = user.id) {
    await tag.destroy();
    return true;
  }
  else return false;
}

var apiUpdateableFields = [];

function getFrontendFields() {
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
}

var apiSettableFields = [
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

function addAssociations(models) {
  models.Tag.belongsTo(models.ThermalVideoRecording);
  models.Tag.belongsTo(models.IrVideoRecording);
  models.Tag.belongsTo(models.AudioRecording);
  models.Tag.belongsTo(models.User, {as: 'tagger'});
  models.Tag.belongsTo(models.Recording);
}
