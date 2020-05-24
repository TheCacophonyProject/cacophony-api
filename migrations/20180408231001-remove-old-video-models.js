"use strict";

module.exports = {
  up: async function (queryInterface) {
    // Disconnect ThermalVideoRecordings and IrVideoRecordings from other tables.
    await queryInterface.removeColumn("Tags", "IrVideoRecordingId");
    await queryInterface.removeColumn("Tags", "ThermalVideoRecordingId");

    await queryInterface.dropTable("ThermalVideoRecordings");
    return queryInterface.dropTable("IrVideoRecordings");
  },

  down: async function () {
    // No going back.
  }
};
