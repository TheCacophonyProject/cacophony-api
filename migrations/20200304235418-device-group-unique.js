"use strict";
// CITEXT extension must be installed with a more privilaged user
// CREATE EXTENSION IF NOT EXISTS citext;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint("Devices", "Devices_devicename_key");

    await queryInterface.changeColumn("Devices", "devicename", {
      type: Sequelize.CITEXT,
    });
    await queryInterface.changeColumn("Groups", "groupname", {
      type: Sequelize.CITEXT,
    });
    await queryInterface.changeColumn("Users", "username", {
      type: Sequelize.CITEXT,
    });
    await queryInterface.changeColumn("Users", "email", {
      type: Sequelize.CITEXT,
    });
    await queryInterface.addConstraint("Devices", {
      fields: ["devicename", "GroupId"],
      type: "unique",
      name: "Devices_devicename_group_key",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint(
      "Devices",
      "Devices_devicename_group_key"
    );
    await queryInterface.addConstraint("Devices", ["devicename"], {
      type: "unique",
      name: "Devices_devicename_key",
    });
    await queryInterface.changeColumn("Devices", "devicename", {
      type: Sequelize.TEXT,
    });
    await queryInterface.changeColumn("Groups", "groupname", {
      type: Sequelize.TEXT,
    });
    await queryInterface.changeColumn("Users", "username", {
      type: Sequelize.TEXT,
    });
    await queryInterface.changeColumn("Users", "email", {
      type: Sequelize.TEXT,
    });
  },
};
