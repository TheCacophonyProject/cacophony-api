"use strict";

module.exports = {
  up: function (queryInterface) {
    return queryInterface.addIndex("Recordings", {
      fields: ["processingState"]
    });
  },

  down: function (queryInterface) {
    return queryInterface.removeIndex("Recordings", ["processingState"]);
  }
};
