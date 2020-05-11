"use strict";

module.exports = {
  up: function (queryInterface) {
    return queryInterface.addIndex("Groups", {
      fields: ["groupname"],
      unique: true
    });
  },

  down: function (queryInterface) {
    return queryInterface.removeIndex("Groups", ["groupname"]);
  }
};
