"use strict";

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "Recordings",
      "relativeToDawn",
      Sequelize.INTEGER
    );
    await queryInterface.addColumn(
      "Recordings",
      "relativeToDusk",
      Sequelize.INTEGER
    );
  },

  down: async function (queryInterface) {
    await queryInterface.removeColumn("Recordings", "relativeToDawn");
    await queryInterface.removeColumn("Recordings", "relativeToDusk");
  },
};
