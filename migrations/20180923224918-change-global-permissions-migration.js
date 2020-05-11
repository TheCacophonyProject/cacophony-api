"use strict";

// This migration removes the superuser BOOLEAN for a enum globalPermission (off, read, write)
// Users that were superusers should now have 'write' global permissions

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface
      .addColumn("Users", "globalPermission", {
        type: Sequelize.ENUM,
        values: ["off", "read", "write"],
        defaultValue: "off"
      })
      .then(() =>
        queryInterface.sequelize.query(
          `UPDATE "Users" SET "globalPermission" = CASE
           WHEN "superuser" = true THEN 'write'::"enum_Users_globalPermission"
           ELSE 'off'::"enum_Users_globalPermission" END`
        )
      )
      .then(() => queryInterface.removeColumn("Users", "superuser"));
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface
      .addColumn("Users", "superuser", {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      })
      .then(() =>
        queryInterface.sequelize.query(
          `UPDATE "Users" SET "superuser" = "globalPermission" = 'write'::"enum_Users_globalPermission"`
        )
      )
      .then(() => queryInterface.removeColumn("Users", "globalPermission"))
      .then(() =>
        queryInterface.sequelize.query(
          'drop type "enum_Users_globalPermission"'
        )
      );
  }
};
