"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `CREATE INDEX events_datetime ON "Events" ("dateTime");`
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`DROP INDEX events_datetime;`);
  }
};
