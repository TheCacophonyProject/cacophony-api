"use strict";

const util = require("./util/util");

module.exports = {
  up: async function (queryInterface) {
    await queryInterface.sequelize.query(
      `DELETE FROM "Tags" where "AudioRecordingId" is NOT NULL`
    );
    await queryInterface.removeColumn("Tags", "AudioRecordingId");
  },

  down: async function (queryInterface) {
    await util.migrationAddBelongsTo(queryInterface, "Tags", "AudioRecordings");
  }
};
