"use strict";

module.exports = {
  up: function (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn("AudioRecordings", "version", Sequelize.STRING),
      queryInterface.addColumn(
        "IrVideoRecordings",
        "version",
        Sequelize.STRING
      ),
      queryInterface.addColumn(
        "ThermalVideoRecordings",
        "version",
        Sequelize.STRING
      )
    ]);
  },

  down: function (queryInterface) {
    return Promise.all([
      queryInterface.removeColumn("AudioRecordings", "version"),
      queryInterface.removeColumn("IrVideoRecordings", "version"),
      queryInterface.removeColumn("ThermalVideoRecordings", "version")
    ]);
  }
};
