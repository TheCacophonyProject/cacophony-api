'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("Devices", "saltId", Sequelize.INTEGER),
      queryInterface.addColumn("Devices", "active", {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      }),
    ]);
  },

  down: queryInterface => {
    return Promise.all([
      queryInterface.removeColumn("Devices", "saltId"),
      queryInterface.removeColumn("Devices", "active"),
    ]);
  }
};
