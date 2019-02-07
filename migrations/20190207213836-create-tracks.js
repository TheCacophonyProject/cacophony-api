'use strict';
var util = require('../models/util/util');

module.exports = {
  up: async function(queryInterface, Sequelize) {
    await queryInterface.createTable('Tracks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      algorithm: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      createdAt: { type: Sequelize.DATE, allowedNull: false },
      updatedAt: { type: Sequelize.DATE, allowedNull: false },
    });
    await util.migrationAddBelongsTo(queryInterface, 'Tracks', 'Recordings', "strict");

    await queryInterface.createTable('TrackTags', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      what: {
        type: Sequelize.STRING,
        allowNull: false
      },
      confidence: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      automatic: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      createdAt: { type: Sequelize.DATE, allowedNull: false },
      updatedAt: { type: Sequelize.DATE, allowedNull: false },
    });
    await util.migrationAddBelongsTo(queryInterface, 'TrackTags', 'Tracks', "strict");
    await util.migrationAddBelongsTo(queryInterface, 'TrackTags', 'Users');
  },

  down: async function(queryInterface, Sequelize) {
    await util.migrationRemoveBelongsTo(queryInterface, 'TrackTags', 'Users');
    await util.migrationRemoveBelongsTo(queryInterface, 'TrackTags', 'Tracks');
    await queryInterface.dropTable('TrackTags');

    await util.migrationRemoveBelongsTo(queryInterface, 'Tracks', 'Recordings');
    await queryInterface.dropTable('Tracks');
  }
};
