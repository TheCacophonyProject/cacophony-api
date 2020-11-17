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
      alertName: {
        type: Sequelize.TEXT
      },
      alert: {
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
    await queryInterface.createTable("AlertDevices", {
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.createTable("AlertGroups", {
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    }),
      await queryInterface.createTable("UserAlerts", {
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false }
      }),
      await util.addSerial(queryInterface, "UserAlerts");
    await util.addSerial(queryInterface, "AlertDevices");
    await util.addSerial(queryInterface, "AlertGroups");

    return util.belongsToMany(queryInterface, "UserAlerts", "Alerts", "Users");
    return util.belongsToMany(
      queryInterface,
      "AlertDevices",
      "Alerts",
      "Devices"
    );
    return util.belongsToMany(
      queryInterface,
      "AlertGroups",
      "Alerts",
      "Groups"
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("AlertDevices");
    await queryInterface.dropTable("AlertGroups");
    await queryInterface.dropTable("UserAlerts");
    await queryInterface.dropTable("Alerts");
  }
};
