"use strict";
const util = require("./util/util");

module.exports = {
  up: function (queryInterface) {
    return queryInterface.dropTable("AudioRecordings");
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface
      .createTable("AudioRecordings", {
        fileKey: Sequelize.STRING,
        mimeType: Sequelize.STRING,
        size: Sequelize.INTEGER,
        duration: Sequelize.INTEGER,
        recordingDateTime: Sequelize.DATE,
        recordingTime: Sequelize.STRING,
        location: Sequelize.GEOMETRY,
        batteryLevel: Sequelize.DOUBLE,
        batteryCharging: Sequelize.STRING,
        airplaneModeOn: Sequelize.BOOLEAN,
        filtered: { type: Sequelize.BOOLEAN, defaultValue: false },
        filterMetadata: Sequelize.JSONB,
        passedFilter: Sequelize.BOOLEAN,
        public: { type: Sequelize.BOOLEAN, defaultValue: false },
        additionalMetadata: Sequelize.JSONB,
        tags: Sequelize.JSONB,
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        relativeToDawn: Sequelize.INTEGER,
        relativeToDusk: Sequelize.INTEGER,
        version: Sequelize.STRING
      })
      .then(() => util.addSerial(queryInterface, "AudioRecordings"))
      .then(() =>
        util.migrationAddBelongsTo(queryInterface, "AudioRecordings", "Groups")
      )
      .then(() =>
        util.migrationAddBelongsTo(queryInterface, "AudioRecordings", "Devices")
      );
  }
};
