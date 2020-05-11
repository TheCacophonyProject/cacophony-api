"use strict";

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "Recordings",
      "rawMimeType",
      Sequelize.STRING
    );
    await queryInterface.sequelize.query(`
        UPDATE "Recordings"
        SET "rawMimeType" = 'application/x-cptv'
        WHERE type = 'thermalRaw'
    `);
  },

  down: async function (queryInterface) {
    await queryInterface.removeColumn("Recordings", "rawMimeType");
  },
};
