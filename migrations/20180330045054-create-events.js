"use strict";
const util = require("./util/util");

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.createTable("EventDetails", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.STRING
      },
      details: {
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

    await queryInterface.createTable("Events", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      dateTime: {
        type: Sequelize.DATE
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
    await util.migrationAddBelongsTo(queryInterface, "Events", "Devices");
    await util.migrationAddBelongsTo(queryInterface, "Events", "EventDetails");
  },
  down: async function (queryInterface) {
    await queryInterface.dropTable("Events");
    await queryInterface.dropTable("EventDetails");
  }
};
