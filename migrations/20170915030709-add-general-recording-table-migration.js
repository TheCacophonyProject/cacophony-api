"use strict";
const util = require("./util/util");

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.createTable("Recordings", {
      // Raw file data.
      rawFileKey: Sequelize.STRING,
      rawFileSize: Sequelize.INTEGER,
      // Processing fields. Fields set by and for the processing.
      fileKey: Sequelize.STRING,
      fileSize: Sequelize.STRING,
      fileMimeType: Sequelize.STRING,
      processingStartTime: Sequelize.DATE,
      processingMeta: Sequelize.JSONB,
      processingState: Sequelize.STRING,
      passedFilter: Sequelize.BOOLEAN,
      // recording metadata.
      duration: Sequelize.INTEGER,
      recordingDateTime: Sequelize.DATE,
      location: Sequelize.GEOMETRY,
      version: Sequelize.STRING,
      // Battery relevant fields.
      batteryLevel: Sequelize.DOUBLE,
      batteryCharging: Sequelize.STRING,
      airplaneModeOn: Sequelize.BOOLEAN,
      // Other fields
      jobKey: Sequelize.STRING,
      type: Sequelize.STRING, // What type of recording it is.
      public: { type: Sequelize.BOOLEAN, defaultValue: false },
      additionalMetadata: Sequelize.JSONB,
      createdAt: { type: Sequelize.DATE, allowedNull: false },
      updatedAt: { type: Sequelize.DATE, allowedNull: false }
    });
    await util.addSerial(queryInterface, "Recordings");
    await util.migrationAddBelongsTo(queryInterface, "Recordings", "Groups");
    await util.migrationAddBelongsTo(queryInterface, "Tags", "Recordings");
    return util.migrationAddBelongsTo(queryInterface, "Recordings", "Devices");
  },

  down: async function (queryInterface) {
    await queryInterface.removeColumn("Tags", "RecordingId");
    return queryInterface.dropTable("Recordings");
  }
};
