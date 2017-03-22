'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.sequelize.query(
        'ALTER TABLE "ThermalVideoRecordings" ' +
        ' ADD COLUMN "videoPair" boolean DEFAULT false;'
      ),
      queryInterface.sequelize.query(
        'ALTER TABLE "IrVideoRecordings" ' +
        ' ADD COLUMN "videoPair" boolean DEFAULT false;'
      ),
    ]);
  },

  down: function(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.sequelize.query(
        'ALTER TABLE "ThermalVideoRecordings" ' +
        ' DROP COLUMN "videoPair";'
      ),
      queryInterface.sequelize.query(
        'ALTER TABLE "IrVideoRecordings" ' +
        ' DROP COLUMN "videoPair";'
      ),
    ]);
  }
};
