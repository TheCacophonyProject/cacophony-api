"use strict";
const util = require("./util/util");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Alerts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.TEXT
      },
      frequencySeconds: {
        type: Sequelize.INTEGER
      },
      lastAlert: {
        allowNull: true,
        type: Sequelize.DATE
      },
      conditions: {
        type: Sequelize.JSON
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await util.migrationAddBelongsTo(queryInterface, "Alerts", "Users");
    await util.migrationAddBelongsTo(queryInterface, "Alerts", "Devices");
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("Alerts");
  }
};
