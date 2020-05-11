"use strict";

module.exports = {
  up: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Recordings", "fileSize"),
      queryInterface.removeColumn("Recordings", "rawFileSize"),
      queryInterface.removeColumn("Files", "fileSize"),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("Recordings", "fileSize", Sequelize.STRING),
      queryInterface.addColumn("Recordings", "rawFileSize", Sequelize.STRING),
      queryInterface.addColumn("Files", "fileSize", Sequelize.STRING),
    ]);
  },
};
