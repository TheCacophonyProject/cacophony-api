'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Tags', 'number');
    await queryInterface.removeColumn('Tags', 'trapType');
    await queryInterface.removeColumn('Tags', 'sex');
    await queryInterface.sequelize.query('DROP TYPE "enum_Tags_sex"');
    await queryInterface.removeColumn('Tags', 'age');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Tags', 'number', Sequelize.INTEGER);
    await queryInterface.addColumn('Tags', 'trapType', Sequelize.STRING);
    await queryInterface.addColumn('Tags', 'sex', Sequelize.ENUM('M', 'F'));
    await queryInterface.addColumn('Tags', 'age', Sequelize.INTEGER);
  }
};
