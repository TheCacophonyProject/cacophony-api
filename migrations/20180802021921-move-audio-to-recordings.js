"use strict";

module.exports = {
  up: async function (queryInterface) {
    // Move audio recordings to Recordings. Leave the source data
    // alone in case of disaster.
    await queryInterface.sequelize.query(`
        INSERT INTO "Recordings" (
            type,
            "DeviceId",
            "GroupId",
            "additionalMetadata",
            "airplaneModeOn",
            "batteryCharging",
            "batteryLevel",
            "createdAt",
            duration,
            "fileKey",
            "fileMimeType",
            "fileSize",
            location,
            "processingState",
            "recordingDateTime",
            "relativeToDawn",
            "relativeToDusk",
            "updatedAt",
            public,
            version
        )
        SELECT
            'audio' as type,
            "DeviceId",
            "GroupId",
            "additionalMetadata",
            "airplaneModeOn",
            "batteryCharging",
            "batteryLevel",
            "createdAt",
            duration,
            "fileKey",
            "mimeType" as "fileMimeType",
            size as "fileSize",
            location,
            'FINISHED' as "processingState",
            "recordingDateTime",
            "relativeToDawn",
            "relativeToDusk",
            "updatedAt",
            public,
            version
        FROM "AudioRecordings"
    `);
  },

  // Do nothing here. Safer to do manual reversal.
  down: function () {}
};
