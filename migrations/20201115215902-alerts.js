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
      frequencySeconds: {
        type: Sequelize.INTEGER
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
    await queryInterface.createTable("AlertConditions", {
      tag: { type: Sequelize.TEXT, allowNull: false },
      automatic: {type:Sequelize.BOOLEAN, defaultValue:false, allowNull:false},
      updatedAt: { type: Sequelize.DATE, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable("AlertLog", {
      sentAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable("AlertDevices", {
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.createTable("UserAlerts", {
      admin: { type: Sequelize.BOOLEAN, defaultValue: false , allowNull:false},
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    }),
    await util.addSerial(queryInterface, "AlertLog");
    await util.addSerial(queryInterface, "AlertConditions");

    await util.addSerial(queryInterface, "UserAlerts");
    await util.addSerial(queryInterface, "AlertDevices");
    await util.migrationAddBelongsTo(queryInterface, "AlertConditions", "Alerts");

    await util.migrationAddBelongsTo(queryInterface, "AlertLog", "Alerts");
    await util.belongsToMany(queryInterface, "UserAlerts", "Alerts", "Users");
    await util.belongsToMany(
      queryInterface,
      "AlertDevices",
      "Alerts",
      "Devices"
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("AlertLog");
    await queryInterface.dropTable("AlertDevices");
    await queryInterface.dropTable("AlertGroups");
    await queryInterface.dropTable("UserAlerts");
    await queryInterface.dropTable("Alerts");
  }
};
