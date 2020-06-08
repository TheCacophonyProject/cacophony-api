"use strict";
const util = require("./util/util");

module.exports = {
  up: function (queryInterface, Sequelize) {
    return new Promise(function (resolve, reject) {
      console.log("Create tag table.");
      queryInterface
        .createTable("Tags", {
          animal: {
            // Name of animal for the Tag
            type: Sequelize.ENUM(
              "rat",
              "possum",
              "hedgehog",
              "stoat",
              "ferrit",
              "weasle",
              "mouse",
              "cat",
              "dog",
              "rabbit",
              "hare",
              "human",
              "bird"
            )
          },
          confidence: {
            // 0-Not sure at all, 1-100% positive.
            type: Sequelize.FLOAT
          },
          startTime: {
            // Start time of the tag in the linked recording in seconds
            type: Sequelize.FLOAT
          },
          duration: {
            // duration of the tag
            type: Sequelize.FLOAT
          },
          number: {
            // Number of animals in tag
            type: Sequelize.INTEGER
          },
          trapType: {
            type: Sequelize.STRING
          },
          // Time in the recording that the pest started interacting with the trap
          trapInteractionTime: {
            type: Sequelize.FLOAT
          },
          // How long the trap is interacted for before triggering
          trapInteractionDuration: {
            type: Sequelize.FLOAT
          },
          trappedTime: {
            // If the animal got trapped, time in the recording.
            type: Sequelize.FLOAT
          },
          killedTime: {
            // If the animal got killed, time in the recording.
            type: Sequelize.FLOAT
          },
          poisionedTime: {
            // If the animal got poisioned, time in the recording.
            type: Sequelize.FLOAT
          },
          sex: {
            // What sex is the animal, null if don't know.
            type: Sequelize.ENUM("M", "F")
          },
          age: {
            // Guessed age in weeks of animal
            type: Sequelize.INTEGER
          },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false }
        })
        .then(() => {
          return util.addSerial(queryInterface, "Tags");
        })
        .then(() => {
          return Promise.all([
            util.migrationAddBelongsTo(
              queryInterface,
              "Tags",
              "AudioRecordings"
            ),
            util.migrationAddBelongsTo(
              queryInterface,
              "Tags",
              "IrVideoRecordings"
            ),
            util.migrationAddBelongsTo(
              queryInterface,
              "Tags",
              "ThermalVideoRecordings"
            ),
            util.migrationAddBelongsTo(queryInterface, "Tags", "Users", {
              name: "tagger"
            })
          ]);
        })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  down: function (queryInterface) {
    return queryInterface.sequelize.query('DROP TABLE "Tags" CASCADE');
  }
};
