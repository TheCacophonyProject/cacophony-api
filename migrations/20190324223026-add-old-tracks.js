'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.addColumn('Tracks', 'archivedAt', Sequelize.DATE, {allowNull: true});
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('Tracks', 'archivedAt');
  }
};
