"use strict";

module.exports = {
  up: async function (queryInterface, Sequelize) {
    return await queryInterface.addColumn("Tags", "automatic", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
  },

  down: async function (queryInterface) {
    return await queryInterface.removeColumn("Tags", "automatic");
  }
};
