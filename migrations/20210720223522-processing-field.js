"use strict";
module.exports = {
  up: async function (queryInterface, Sequelize) {
    return queryInterface.addColumn(
      "Recordings",
      "processing",
      Sequelize.BOOLEAN
    );
  },

  down: async function (queryInterface, Sequelize) {
    return queryInterface.removeColumn("Recordings", "processing");
  }
};
