var bcrypt = require('bcrypt');
var models = require('./')

var Device;

module.exports = function(sequelize, DataTypes) {
  // Define table
  Device =  sequelize.define("Device", {
    devicename: {
      type: DataTypes.STRING,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    location: DataTypes.STRING,
    lastConnectionTime: DataTypes.DATE,
    public: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    currentConfig: DataTypes.JSONB,
    newConfig: DataTypes.JSONB
  }, {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields,
      freeDevicename: freeDevicename
    },
    instanceMethods: {
      comparePassword: comparePassword,
      getJwtDataValues: getJwtDataValues
    },
    hooks: {
      afterValidate: afterValidate
    }
  })
  return Device
}

// Fields that are directly settable by the API.
var apiSettableFields = [
  'location',
  'newConfig'
]

// Returns a promise that resolves true or false depending on if the devicename is used.
function freeDevicename(devicename) {
  return new Promise(function(resolve, reject) {
    Device.findOne({ where: { devicename: devicename } })
      .then(function(device) {
        if (device) {
          resolve(false)
        } else {
          resolve(true)
        }
      })
  })
}


function getJwtDataValues() {
  return {
    id: this.getDataValue('id'),
    _type: 'device'
  }
}

function addAssociations(models) {
  models.Device.hasMany(models.ThermalVideoRecording);
  models.Device.hasMany(models.IrVideoRecording);
  models.Device.hasMany(models.AudioRecording);
}

function afterValidate(device) {

  // TODO Make the password be hashed when the device password is set not in the validation.
  // TODO or make a custome validation for the password.
  return new Promise(function(resolve, reject) {
    bcrypt.hash(device.password, 10, function(err, hash) {
      if (err)
        reject(err);
      else {
        device.password = hash;
        resolve();
      }
    })
  })
}

function comparePassword(password) {
  var device = this;
  return new Promise(function(resolve, reject) {
    bcrypt.compare(password, device.password, function(err, isMatch) {
      if (err) {
        reject(err);
      } else {
        resolve(isMatch);
      }
    })
  })
}
