var util = require('../models/util/util');

module.exports = {
  up: function (queryInterface, Sequelize) {
    return util.migrationAddBelongsTo(queryInterface,
        'ThermalVideoRecordings', 'IrVideoRecordings');
  },

  down: function (queryInterface, Sequelize) {
    return util.migrationRemoveBelongsTo(queryInterface,
        'ThermalVideoRecordings', 'IrVideoRecordings');
  }
};
