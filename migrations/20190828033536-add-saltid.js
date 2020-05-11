"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn("Devices", "saltId", Sequelize.INTEGER),
      queryInterface.addColumn("Devices", "active", {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      })
    ]);
    return queryInterface.sequelize.query(
      'update "Devices" set "saltId" = id where "saltId" is null;'
    );
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Devices", "saltId"),
      queryInterface.removeColumn("Devices", "active")
    ]);
  }
};
