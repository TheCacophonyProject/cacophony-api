"use strict";
const util = require("./util/util");

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.createTable("Schedules", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      schedule: {
        type: Sequelize.JSONB
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

    await util.migrationAddBelongsTo(queryInterface, "Schedules", "Users");
    await util.migrationAddBelongsTo(queryInterface, "Devices", "Schedules");
  },
  down: async function (queryInterface) {
    await util.migrationRemoveBelongsTo(queryInterface, "Devices", "Schedules");
    await queryInterface.dropTable("Schedules");
  }
};
