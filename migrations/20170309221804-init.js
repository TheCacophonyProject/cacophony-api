const util = require("./util/util");

module.exports = {
  up: function (queryInterface, Sequelize) {
    return new Promise(function (resolve, reject) {
      console.log("Create tables.");
      return Promise.all([
        queryInterface.createTable("AudioRecordings", {
          // Fields for a file.
          fileKey: Sequelize.STRING,
          mimeType: Sequelize.STRING,
          size: Sequelize.INTEGER,
          // Fields for a file that is a audio recording.
          duration: Sequelize.INTEGER,
          recordingDateTime: Sequelize.DATE,
          recordingTime: Sequelize.STRING,
          // Fields for location.
          location: Sequelize.GEOMETRY,
          // Battery relevant fields.
          batteryLevel: Sequelize.DOUBLE,
          batteryCharging: Sequelize.STRING,
          airplaneModeOn: Sequelize.BOOLEAN,
          // Fields from filter functions.
          filtered: { type: Sequelize.BOOLEAN, defaultValue: false },
          filterMetadata: Sequelize.JSONB,
          passedFilter: Sequelize.BOOLEAN,
          // Other fields
          public: { type: Sequelize.BOOLEAN, defaultValue: false },
          additionalMetadata: Sequelize.JSONB,
          tags: Sequelize.JSONB,
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false }
        }),
        queryInterface.createTable("Devices", {
          devicename: { type: Sequelize.STRING, unique: true },
          password: { type: Sequelize.STRING, allowNull: false },
          location: Sequelize.STRING,
          lastConnectionTime: Sequelize.STRING,
          public: { type: Sequelize.BOOLEAN, defaultValue: false },
          currentConfig: Sequelize.JSONB,
          newConfig: Sequelize.JSONB,
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false }
        }),
        queryInterface.createTable("Groups", {
          groupname: Sequelize.STRING,
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false }
        }),
        queryInterface.createTable("GroupUsers", {
          admin: { type: Sequelize.BOOLEAN, defaultValue: false },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false }
        }),
        queryInterface.createTable("IrVideoRecordings", {
          // Fields for a file.
          fileKey: Sequelize.STRING,
          mimeType: Sequelize.STRING,
          size: Sequelize.INTEGER,
          // Fields for a file that is a video recording.
          duration: Sequelize.INTEGER,
          recordingDateTime: Sequelize.DATE,
          recordingTime: Sequelize.STRING,
          // Fields for location.
          location: Sequelize.GEOMETRY,
          // Battery relevant fields.
          batteryLevel: Sequelize.DOUBLE,
          batteryCharging: Sequelize.STRING,
          airplaneModeOn: Sequelize.BOOLEAN,
          // Fields from filter functions.
          filtered: { type: Sequelize.BOOLEAN, defaultValue: false },
          filterMetadata: Sequelize.JSONB,
          passedFilter: Sequelize.BOOLEAN,
          // Other fields
          public: { type: Sequelize.BOOLEAN, defaultValue: false },
          additionalMetadata: Sequelize.JSONB,
          tags: Sequelize.JSONB,
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false }
        }),
        queryInterface.createTable("ThermalVideoRecordings", {
          // Fields for a file.
          fileKey: Sequelize.STRING,
          mimeType: Sequelize.STRING,
          size: Sequelize.INTEGER,
          // Fields for a file that is a video recording.
          duration: Sequelize.INTEGER,
          recordingDateTime: Sequelize.DATE,
          recordingTime: Sequelize.STRING,
          // Fields for location.
          location: Sequelize.GEOMETRY,
          // Battery relevant fields.
          batteryLevel: Sequelize.DOUBLE,
          batteryCharging: Sequelize.STRING,
          airplaneModeOn: Sequelize.BOOLEAN,
          // Fields from filter functions.
          filtered: { type: Sequelize.BOOLEAN, defaultValue: false },
          filterMetadata: Sequelize.JSONB,
          passedFilter: Sequelize.BOOLEAN,
          // Other fields
          public: { type: Sequelize.BOOLEAN, defaultValue: false },
          additionalMetadata: Sequelize.JSONB,
          tags: Sequelize.JSONB,
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false }
        }),
        queryInterface.createTable("Users", {
          username: { type: Sequelize.STRING, unique: true },
          firstName: Sequelize.STRING,
          lastName: Sequelize.STRING,
          email: Sequelize.STRING,
          password: { type: Sequelize.STRING, allowNull: false },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false }
        })
      ])
        .then(() => {
          console.log("Adding Serial ID to colums.");
          return Promise.all([
            util.addSerial(queryInterface, "AudioRecordings"),
            util.addSerial(queryInterface, "Devices"),
            util.addSerial(queryInterface, "Groups"),
            util.addSerial(queryInterface, "GroupUsers"),
            util.addSerial(queryInterface, "IrVideoRecordings"),
            util.addSerial(queryInterface, "ThermalVideoRecordings"),
            util.addSerial(queryInterface, "Users")
          ]);
        })
        .then(() => {
          console.log("Finshed creating tables.");
          console.log("Creating associations.");
          return Promise.all([
            util.migrationAddBelongsTo(
              queryInterface,
              "AudioRecordings",
              "Groups"
            ),
            util.migrationAddBelongsTo(
              queryInterface,
              "IrVideoRecordings",
              "Groups"
            ),
            util.migrationAddBelongsTo(
              queryInterface,
              "ThermalVideoRecordings",
              "Groups"
            ),
            util.migrationAddBelongsTo(
              queryInterface,
              "AudioRecordings",
              "Devices"
            ),
            util.migrationAddBelongsTo(
              queryInterface,
              "IrVideoRecordings",
              "Devices"
            ),
            util.migrationAddBelongsTo(
              queryInterface,
              "ThermalVideoRecordings",
              "Devices"
            ),
            util.migrationAddBelongsTo(queryInterface, "Devices", "Groups"),
            util.migrationAddBelongsTo(queryInterface, "Devices", "Users"),
            util.belongsToMany(queryInterface, "GroupUsers", "Groups", "Users")
          ]);
        })
        .then(() => {
          console.log("Finished adding associations.");
          console.log("Finished INIT migration.");
          resolve();
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  },

  down: function () {
    return new Promise(function (resolve, reject) {
      console.log("Can not undo init migration.");
      reject("Can not undo init migration.");
    });
  }
};
