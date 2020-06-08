const util = require("./util/util");

module.exports = {
  up: function (queryInterface) {
    return util.migrationAddBelongsTo(
      queryInterface,
      "ThermalVideoRecordings",
      "IrVideoRecordings"
    );
  },

  down: function (queryInterface) {
    return util.migrationRemoveBelongsTo(
      queryInterface,
      "ThermalVideoRecordings",
      "IrVideoRecordings"
    );
  }
};
