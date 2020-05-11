"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Tags", "number");
    await queryInterface.removeColumn("Tags", "trapType");
    await queryInterface.removeColumn("Tags", "sex");
    await queryInterface.sequelize.query('DROP TYPE "enum_Tags_sex"');
    await queryInterface.removeColumn("Tags", "age");

    await queryInterface.addColumn("Tags", "version", {
      type: Sequelize.INTEGER,
      defaultValue: 0x0100,
    });

    await queryInterface.renameColumn("Tags", "animal", "what");
    await queryInterface.renameColumn("Tags", "event", "detail");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("Tags", "what", "animal");
    await queryInterface.renameColumn("Tags", "detail", "event");

    await queryInterface.removeColumn("Tags", "version");

    await queryInterface.addColumn("Tags", "number", Sequelize.INTEGER);
    await queryInterface.addColumn("Tags", "trapType", Sequelize.STRING);
    await queryInterface.addColumn("Tags", "sex", Sequelize.ENUM("M", "F"));
    await queryInterface.addColumn("Tags", "age", Sequelize.INTEGER);
  },
};
