"use strict";
const util = require("./util/util");

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.createTable("Files", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.STRING
      },
      fileKey: {
        type: Sequelize.STRING
      },
      fileSize: {
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

    await util.migrationAddBelongsTo(queryInterface, "Files", "Users");
  },

  down: function (queryInterface) {
    return queryInterface.dropTable("Files");
  }
};
