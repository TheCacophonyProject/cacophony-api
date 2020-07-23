"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `UPDATE "TrackTags" set "what"='false-positive' where "what" = 'false positive'`
    );
  },
  down: async () => {}
};
