'use strict';
var util = require('../models/util/util');

module.exports = {
  up: async function(queryInterface, Sequelize) {
    await queryInterface.createTable('Schedules', {
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

    await util.migrationAddBelongsTo(queryInterface, 'Schedules', 'Users');
  },
  down: function(queryInterface) {
    return queryInterface.dropTable('Schedules');
  }
};