'use strict';

module.exports = {
  up: async function (queryInterface) {
    // mustelid
    await queryInterface.sequelize.query(`UPDATE "Tags" set "animal"='mustelid' where "animal"='stoat' or "animal"='weasel' or "animal"='ferret'`);
    await queryInterface.sequelize.query(`UPDATE "TrackTags" set "what"='mustelid' where "what"='stoat' or "what"='weasel' or "what"='ferret'`);

    // insect
    await queryInterface.sequelize.query(`UPDATE "Tags" set "animal"='insect' where "animal"='spider'`);
    await queryInterface.sequelize.query(`UPDATE "TrackTags" set "what"='insect' where "what"='spider'`);

    // leporidae
    await queryInterface.sequelize.query(`UPDATE "Tags" set "animal"='leporidae' where "animal"='hare' or "animal"='rabbit'`);
    await queryInterface.sequelize.query(`UPDATE "TrackTags" set "what"='leporidae' where "what"='hare' or "what"='rabbit'`);

    // rodent
    await queryInterface.sequelize.query(`UPDATE "Tags" set "animal"='rodent' where "animal"='rat' or "animal"='mouse'`);
    await queryInterface.sequelize.query(`UPDATE "TrackTags" set "what"='rodent' where "what"='rat' or "what"='mouse'`);
  },

  down: async function (queryInterface) {
    // no reversing....
  }
};