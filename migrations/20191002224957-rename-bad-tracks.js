"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `UPDATE "TrackTags" set "what"='poor tracking' where "what" = 'bad track'`
    );
    await queryInterface.sequelize.query(
      `UPDATE "TrackTags" set "what"='unknown' where "what" = 'unidentified'`
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `UPDATE "TrackTags" set "what"='bad track' where "what" = 'poor tracking'`
    );
    await queryInterface.sequelize.query(
      `UPDATE "TrackTags" set "what"='unidentified' where "what" = 'unknown'`
    );
  },
};
