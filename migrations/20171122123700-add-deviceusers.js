const util = require("./util/util");

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.removeColumn("Devices", "UserId");
    await queryInterface.createTable("DeviceUsers", {
      admin: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await util.addSerial(queryInterface, "DeviceUsers");
    return util.belongsToMany(
      queryInterface,
      "DeviceUsers",
      "Devices",
      "Users"
    );
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.dropTable("DeviceUsers");
    return queryInterface.addColumn("Devices", "UserId", {
      type: Sequelize.INTEGER
    });
  }
};
