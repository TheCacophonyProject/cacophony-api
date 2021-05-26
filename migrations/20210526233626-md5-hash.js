"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("Recordings", "md5", Sequelize.STRING, {
      allowNull: true
    });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn("Recordings", "md5");
  }
};
