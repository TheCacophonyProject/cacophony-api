var Sequelize = require('sequelize'),
  config = require('./config');

var sequelize = new Sequelize(config.db.name, config.db.username, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: config.db.dialect,
  logging: config.db.logging
});

var DataPoint = sequelize.define('data_point', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  deviceId: { type: Sequelize.INTEGER, allowNull: false, field: 'device_id' },
  hardwareId: { type: Sequelize.INTEGER, allowNull: false, field: 'hardware_id' },
  softwareId: { type: Sequelize.INTEGER, allowNull: false, field: 'software_id' },
  locationId: { type: Sequelize.INTEGER, allowNull: false, field: 'location_id' },
  fileName: { type: Sequelize.STRING, allowNull: false, fieldName: 'file_name' },
  fileExtension: { type: Sequelize.STRING, allowNull: false, fieldName: 'file_extension' },
  startTimeUtc: { type: Sequelize.BIGINT, allowNull: false, fieldName: 'start_time_utc' },
  duration: { type: Sequelize.INTEGER },
  ruleName: { type: Sequelize.STRING, fieldName: 'rule_name' },
  bitRate: { type: Sequelize.INTEGER, fieldName: 'bit_rate' }
});

var Software = sequelize.define('software', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  osCodename: { type: Sequelize.STRING, fieldName: 'os_codename' },
  osIncremental: { type: Sequelize.STRING, fieldName: 'os_incremental' },
  sdkInt: { type: Sequelize.INTEGER, fieldName: 'sdk_int' },
  osRelease: { type: Sequelize.STRING, fieldName: 'os_release' },
  appVersion: { type: Sequelize.STRING, fieldName: 'app_version' }
});

var Hardware = sequelize.define('hardware', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  model: { type: Sequelize.STRING },
  manufacturer: { type: Sequelize.STRING },
  brand: { type: Sequelize.STRING },
  microphoneId: { type: Sequelize.INTEGER, defaultValue: 0 }
});

var Location = sequelize.define('location', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  longitude: { type: Sequelize.FLOAT, allowNull: false },
  latitude: { type: Sequelize.FLOAT, allowNull: false },
  utc: { type: Sequelize.BIGINT },
  altitude: { type: Sequelize.INTEGER },
  accuracy: { type: Sequelize.FLOAT },
  userLocationInput: { type: Sequelize.STRING, table: 'user_location_input' }
});

var Device = sequelize.define('device', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  lastUploadId: { type: Sequelize.INTEGER, table: 'last_upload_id' },
  uploadCount: { type: Sequelize.INTEGER, table: 'upload_count' },
  timeOfRegistration: { type: Sequelize.BIGINT, table: 'time_of_registration' }
});


function createTestDevice(){
  return Device.create({
    lastUploadId: 4,
    uploadCount: 2,
    timeOfRegistration: 5
  });
}

function uploadLocation(location){
  var locationJson = {};
  if (location.longitude) locationJson.longitude = location.longitude;
  if (location.latitude) locationJson.latitude = location.latitude;
  if (location.utc) locationJson.utc = location.utc;
  if (location.altitude) locationJson.altitude = location.altitude;
  if (location.accuracy) locationJson.accuracy = location.accuracy;
  if (location.userLocationInput) locationJson.userLocationInput = location.userLocationInput;
  return Location.create(locationJson);
}

function uploadHardware(hardware) {
  var hardwareJson = {};
  if (hardware.model) hardwareJson.model = hardware.model;
  if (hardware.manufacturer) hardwareJson.manufacturer = hardware.manufacturer;
  if (hardware.brand) hardwareJson.brand = hardware.brand;
  if (hardware.microphoneId) hardwareJson.microphoneId = hardware.microphoneId;
  return Hardware.create(hardwareJson);
}

function uploadSoftware(software) {
  var softwareJson = {};
  if (software.osIncremental) softwareJson.osIncremental = software.osIncremental;
  if (software.osCodename) softwareJson.osCodename = software.osCodename;
  if (software.sdkInt) softwareJson.sdkInt = software.sdkInt;
  if (software.osRelease) softwareJson.osRelease = software.osRelease;
  if (software.appVersion) softwareJson.appVersio = software.appVersion;
  return Software.create(softwareJson);
}

function uploadDataPoint(dataPoint) {
  var dataPointJson = {
    deviceId: dataPoint.deviceId,
    hardwareId: dataPoint.hardware.id,
    softwareId: dataPoint.software.id,
    locationId: dataPoint.location.id,
    file: dataPoint.file,
    fileExtension: dataPoint.fileExtension,
    startTimeUtc: dataPoint.mainData.startTimeUtc,
    duration: dataPoint.mainData.duration,
    ruleName: dataPoint.mainData.ruleName,
    bitRate: dataPoint.mainData.bitRate
  };
  return DataPoint.create(dataPointJson);
}

function sync(){
  return sequelize.sync();
}


exports.uploadDataPoint = uploadDataPoint;
exports.uploadSoftware = uploadSoftware;
exports.uploadHardware = uploadHardware;
exports.uploadLocation = uploadLocation;
exports.sync = sync;
exports.Location = Location;
exports.Software = Software;
exports.Hardware = Hardware;
