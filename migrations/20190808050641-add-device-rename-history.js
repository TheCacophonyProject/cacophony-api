'use strict';

const util = require("../models/util/util");

const tableName = "DeviceHistories";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(tableName, {
      oldName: { type: Sequelize.STRING, allowNull: false },
      newName: { type: Sequelize.STRING, allowNull: false },
      oldGroupID: { type: Sequelize.INTEGER, allowNull: false },
      newGroupID: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    }).then(() => {
      return util.addSerial(queryInterface, tableName);
    }).then(() => {
      return util.migrationAddBelongsTo(queryInterface, tableName, "Devices");
    });
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.query('DROP TABLE "'+tableName+'" CASCADE');
  }
};
