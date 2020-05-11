"use strict";

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.removeColumn("Tags", "trapInteractionTime");
    await queryInterface.removeColumn("Tags", "trapInteractionDuration");
    await queryInterface.removeColumn("Tags", "trappedTime");
    await queryInterface.removeColumn("Tags", "killedTime");
    await queryInterface.removeColumn("Tags", "poisionedTime");
    await queryInterface.changeColumn("Tags", "animal", {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn("Tags", "event", { type: Sequelize.STRING });
    return queryInterface.sequelize.query('DROP TYPE "enum_Tags_animal"');
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn("Tags", "trapInteractionTime", {
      type: Sequelize.FLOAT
    });
    await queryInterface.addColumn("Tags", "trapInteractionDuration", {
      type: Sequelize.FLOAT
    });
    await queryInterface.addColumn("Tags", "trappedTime", {
      type: Sequelize.FLOAT
    });
    await queryInterface.addColumn("Tags", "killedTime", {
      type: Sequelize.FLOAT
    });
    await queryInterface.addColumn("Tags", "poisionedTime", {
      type: Sequelize.FLOAT
    });
    await queryInterface.removeColumn("Tags", "event");
    await queryInterface.removeColumn("Tags", "animal");
    return queryInterface.addColumn("Tags", "animal", {
      type: Sequelize.ENUM(
        "rat",
        "possum",
        "hedgehog",
        "stoat",
        "ferrit",
        "weasle",
        "mouse",
        "cat",
        "dog",
        "rabbit",
        "hare",
        "human",
        "bird"
      )
    });
  }
};
