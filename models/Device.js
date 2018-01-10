var bcrypt = require('bcrypt');

module.exports = function(sequelize, DataTypes) {
  var name = 'Device';

  var attributes = {
    devicename: {
      type: DataTypes.STRING,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type:DataTypes.STRING,
    },
    lastConnectionTime: {
      type: DataTypes.DATE,
    },
    public: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    currentConfig: {
      type: DataTypes.JSONB,
    },
    newConfig: {
      type: DataTypes.JSONB,
    },
  };

  var allForUser = async function(user) {
    // Return all devices if superuser.
    if (user.superuser) {
      return this.findAndCount({
        attributes: ["devicename", "id"],
        order: ['devicename'],
      });
    }

    var deviceIds = await user.getDeviceIds();
    var userGroupIds = await user.getGroupsIds();
    return this.findAndCount({
      where: { "$or": [
        {GroupId: {"$in": userGroupIds}},
        {id: {"$in": deviceIds}},
      ]},
      attributes: ["devicename", "id"],
      order: ['devicename'],
    });
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields,
      allForUser: allForUser,
      freeDevicename: freeDevicename
    },
    instanceMethods: {
      comparePassword: comparePassword,
      getJwtDataValues: getJwtDataValues
    },
    hooks: {
      afterValidate: afterValidate
    }
  };

  return sequelize.define(name, attributes, options);
};

// Fields that are directly settable by the API.
var apiSettableFields = [
  'location',
  'newConfig'
];

// Returns a promise that resolves true or false depending on if the devicename is used.
function freeDevicename(devicename) {
  var Device = this;
  return new Promise(function(resolve, reject) {
    Device.findOne({ where: { devicename: devicename } })
      .then(function(device) {
        if (device) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
  });
}


function getJwtDataValues() {
  return {
    id: this.getDataValue('id'),
    _type: 'device'
  };
}

function addAssociations(models) {
  models.Device.hasMany(models.ThermalVideoRecording);
  models.Device.hasMany(models.IrVideoRecording);
  models.Device.hasMany(models.AudioRecording);
  models.Device.hasMany(models.Recording);
  models.Device.belongsToMany(models.User, { through: models.DeviceUsers });
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
    });
  });
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
    });
  });
}
