"use strict";
module.exports = {
  up: async function (queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.addColumn("Recordings", "processing", Sequelize.BOOLEAN),
      queryInterface.addColumn(
        "Recordings",
        "processingEndTime",
        Sequelize.DATE
      )
    ]);
  },

  down: async function (queryInterface) {
    await Promise.all([
      queryInterface.removeColumn("Recordings", "processing"),
      queryInterface.removeColumn("Recordings", "processingEndTime")
    ]);
  }
};
