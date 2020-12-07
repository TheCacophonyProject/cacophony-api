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

    await queryInterface.createTable("AlertLogs", {
      recId: { type: Sequelize.INTEGER, allowNull: false },
      trackId: { type: Sequelize.INTEGER, allowNull: false },
      success: { type: Sequelize.BOOLEAN, allowNull: false },
      to: { type: Sequelize.STRING, allowNull: false },
      sentAt: { type: Sequelize.DATE, allowNull: true },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false }
    });

    await util.addSerial(queryInterface, "AlertLogs");
    await util.migrationAddBelongsTo(queryInterface, "Alerts", "Users");
    await util.migrationAddBelongsTo(queryInterface, "AlertLogs", "Alerts");
    await util.migrationAddBelongsTo(queryInterface, "Alerts", "Devices");
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("AlertLogs");
    await queryInterface.dropTable("Alerts");
  }
};
