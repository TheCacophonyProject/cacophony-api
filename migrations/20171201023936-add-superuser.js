"use strict";

module.exports = {
  up: async function (queryInterface, Sequelize) {
    return await queryInterface.addColumn("Users", "superuser", {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: async function (queryInterface) {
    return await queryInterface.removeColumn("Users", "superuser");
  }
};
