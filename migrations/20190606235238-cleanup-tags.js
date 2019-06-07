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

  down: async function (queryInterface) {
    // mustelid
    await queryInterface.sequelize.query(`UPDATE "Tags" set "what"='stoat' where "what"='mustelid'`);
    await queryInterface.sequelize.query(`UPDATE "TrackTags" set "what"='stoat' where "what"='mustelid'`);

    // leporidae
    await queryInterface.sequelize.query(`UPDATE "Tags" set "what"='rabbit' where "what"='leporidae'`);
    await queryInterface.sequelize.query(`UPDATE "TrackTags" set "what"='rabbit' where "what"='hare'`);

    // rodent
    await queryInterface.sequelize.query(`UPDATE "Tags" set "what"='rat' where "what"='rodent'`);
    await queryInterface.sequelize.query(`UPDATE "TrackTags" set "what"='rat' where"what"='rodent'`);  }
};