"use strict";

module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn(
        "AudioRecordings",
        "relativeToDawn",
        Sequelize.INTEGER
      ),
      queryInterface.addColumn(
        "IrVideoRecordings",
        "relativeToDawn",
        Sequelize.INTEGER
      ),
      queryInterface.addColumn(
        "ThermalVideoRecordings",
        "relativeToDawn",
        Sequelize.INTEGER
      ),
      queryInterface.addColumn(
        "AudioRecordings",
        "relativeToDusk",
        Sequelize.INTEGER
      ),
      queryInterface.addColumn(
        "IrVideoRecordings",
        "relativeToDusk",
        Sequelize.INTEGER
      ),
      queryInterface.addColumn(
        "ThermalVideoRecordings",
        "relativeToDusk",
        Sequelize.INTEGER
      ),
    ]);
  },

  down: function (queryInterface) {
    return Promise.all([
      queryInterface.removeColumn("AudioRecordings", "relativeToDawn"),
      queryInterface.removeColumn("IrVideoRecordings", "relativeToDawn"),
      queryInterface.removeColumn("ThermalVideoRecordings", "relativeToDawn"),
      queryInterface.removeColumn("AudioRecordings", "relativeToDusk"),
      queryInterface.removeColumn("IrVideoRecordings", "relativeToDusk"),
      queryInterface.removeColumn("ThermalVideoRecordings", "relativeToDusk"),
    ]);
  },
};
