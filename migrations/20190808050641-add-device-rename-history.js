"use strict";

const util = require("./util/util");

const tableName = "DeviceHistory";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(tableName, {
      oldName: { type: Sequelize.STRING, allowNull: false },
      newName: { type: Sequelize.STRING, allowNull: false },
      oldGroupID: { type: Sequelize.INTEGER, allowNull: false },
      newGroupID: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await util.addSerial(queryInterface, tableName);
    await util.migrationAddBelongsTo(queryInterface, tableName, "Devices");
  },

  down: (queryInterface) => {
    return queryInterface.dropTable(tableName);
  }
};
