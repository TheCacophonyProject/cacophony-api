"use strict";

module.exports = {
  up: async function (queryInterface, Sequelize) {
    return await queryInterface.addColumn(
      "Recordings",
      "comment",
      Sequelize.STRING
    );
  },

  down: async function (queryInterface) {
    return await queryInterface.removeColumn("Recordings", "comment");
  }
};
