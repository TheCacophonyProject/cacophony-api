"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      "Users",
      "endUserAgreement",
      Sequelize.INTEGER
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      "Users",
      "endUserAgreement",
      Sequelize.INTEGER
    );
  }
};
