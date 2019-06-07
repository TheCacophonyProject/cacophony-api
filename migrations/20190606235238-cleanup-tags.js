'use strict';

module.exports = {
  up: async function (queryInterface) {
    // mustelid
    await queryInterface.sequelize.query(`UPDATE "Tags" set "what"='mustelid' where "what"='stoat' or "what"='weasel' or "what"='ferret'`);
    await queryInterface.sequelize.query(`UPDATE "TrackTags" set "what"='mustelid' where "what"='stoat' or "what"='weasel' or "what"='ferret'`);

    // insect
    await queryInterface.sequelize.query(`UPDATE "Tags" set "what"='insect' where "what"='spider'`);
    await queryInterface.sequelize.query(`UPDATE "TrackTags" set "what"='insect' where "what"='spider'`);

    // leporidae
    await queryInterface.sequelize.query(`UPDATE "Tags" set "what"='leporidae' where "what"='hare' or "what"='rabbit'`);
    await queryInterface.sequelize.query(`UPDATE "TrackTags" set "what"='leporidae' where "what"='hare' or "what"='rabbit'`);

    // rodent
    await queryInterface.sequelize.query(`UPDATE "Tags" set "what"='rodent' where "what"='rat' or "what"='mouse'`);
    await queryInterface.sequelize.query(`UPDATE "TrackTags" set "what"='rodent' where "what"='rat' or "what"='mouse'`);
  },

  down: async function () {
    // no reversing....
  }
};