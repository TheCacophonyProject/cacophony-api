"use strict";

module.exports = {
  up: (queryInterface) => {
    return Promise.all([
      queryInterface.addIndex("Tags", {
        fields: ["RecordingId"],
        unique: false
      }),
      queryInterface.addIndex("Tags", { fields: ["animal"], unique: false })
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeIndex("Tags", ["RecordingId"]),
      queryInterface.removeIndex("Tags", ["animal"])
    ]);
  }
};
