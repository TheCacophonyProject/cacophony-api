"use strict";

module.exports = {
  up: function (queryInterface) {
    return queryInterface.addIndex("Users", {
      fields: ["email"],
      unique: true
    });
  },

  down: function (queryInterface) {
    return queryInterface.removeIndex("Users", ["email"]);
  }
};
