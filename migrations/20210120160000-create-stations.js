"use strict";

const util = require("./util/util");

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.createTable("Stations", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      location: {
        type: Sequelize.GEOMETRY,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowedNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowedNull: false,
        defaultValue: Sequelize.NOW
      },
      retiredAt: {
        type: Sequelize.DATE,
        allowedNull: true,
        defaultValue: Sequelize.NULL
      }
    });
    await util.migrationAddBelongsTo(queryInterface, "Stations", "Users", {
      name: "lastUpdatedBy"
    });
    await util.migrationAddBelongsTo(queryInterface, "Stations", "Groups");
    await util.migrationAddBelongsTo(queryInterface, "Recordings", "Stations");
  },

  down: async function (queryInterface) {
    await util.migrationRemoveBelongsTo(queryInterface, "Stations", "Users", {
      name: "lastUpdatedBy"
    });
    await util.migrationRemoveBelongsTo(queryInterface, "Stations", "Groups");
    await util.migrationRemoveBelongsTo(
      queryInterface,
      "Recordings",
      "Stations"
    );
    await queryInterface.dropTable("Stations");
  }
};
