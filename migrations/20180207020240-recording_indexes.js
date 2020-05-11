"use strict";

module.exports = {
  up: async function (queryInterface) {
    await queryInterface.addIndex("Recordings", ["recordingDateTime"]);
    await queryInterface.addIndex("Recordings", ["public"]);
    await queryInterface.addIndex("Recordings", ["DeviceId"]);
    await queryInterface.addIndex("Recordings", ["GroupId"]);
  },
  down: async function (queryInterface) {
    await queryInterface.removeIndex("Recordings", ["recordingDateTime"]);
    await queryInterface.removeIndex("Recordings", ["public"]);
    await queryInterface.removeIndex("Recordings", ["DeviceId"]);
    await queryInterface.removeIndex("Recordings", ["GroupId"]);
  },
};
