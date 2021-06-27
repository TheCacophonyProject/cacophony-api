"use strict";
module.exports = {
  up: async function (queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.changeColumn("Recordings", "duration", {
        type: Sequelize.FLOAT
      }),
      queryInterface.addColumn("Recordings", "rawFileHash", Sequelize.STRING)
    ]);
  },

  down: async function (queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.changeColumn("Recordings", "duration", {
        type: Sequelize.INTEGER
      }),
      queryInterface.removeColumn("Recordings", "rawFileHash")
    ]);
  }
};
