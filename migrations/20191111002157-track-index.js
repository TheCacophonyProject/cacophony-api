"use strict";

module.exports = {
  up: async function (queryInterface) {
    await queryInterface.addIndex("Tracks", ["RecordingId"]);
    await queryInterface.addIndex("TrackTags", ["TrackId"]);
  },
  down: async function (queryInterface) {
    await queryInterface.removeIndex("Tracks", ["RecordingId"]);
    await queryInterface.removeIndex("TrackTags", ["TrackId"]);
  },
};
