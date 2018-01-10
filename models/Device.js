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

  const models = sequelize.models;

  /**
  * Adds/update a user to a Device, if the given user has permission to do so.
  * The authenticated user must either be admin of the group that the device
  * belongs to, an admin of that device, or a superuser.
  */
  const addUserToDevice = async function(authUser, deviceId, userToAddId, admin) {
    const device = await models.Device.findById(deviceId);
    const userToAdd = await models.User.findById(userToAddId);
    if (device == null || userToAdd == null) {
      return false;
    }
    // Return false if the user doesn't have permission.
    const isGroupAdmin = await models.GroupUsers.isAdmin(device.groupId, authUser.id);
    const isDeviceAdmin = await models.DeviceUsers.isAdmin(device.id, authUser.id);
    if (!authUser.superuser && !isGroupAdmin && !isDeviceAdmin) {
      return false;
    }

    // Get association if already there and update it.
    var deviceUser = await models.DeviceUsers.findOne({
      where: {
        DeviceId: deviceId,
        UserId: userToAdd.id,
      }
    });
    if (deviceUser != null) {
      deviceUser.admin = admin; // Update admin value.
      await deviceUser.save();
      return true;
    }

    await device.addUser(userToAdd.id, {admin: admin});
    return true;
  };

  /**
   * Removes a user from a Device, if the given user has permission to do so.
   * The user must be a group or device admin, or superuser to do this. .
   */
  var removeUserFromDevice = async function(authUser, deviceId, userToRemoveId) {
    const device = await models.Device.findById(deviceId);
    const userToRemove = await models.User.findById(userToRemoveId);
    if (device == null || userToRemove == null) {
      return false;
    }
    // Return false if the user doesn't have permission.
    const isGroupAdmin = await models.GroupUsers.isAdmin(device.groupId, authUser.id);
    const isDeviceAdmin = await models.DeviceUsers.isAdmin(device.id, authUser.id);
    if (!authUser.superuser && !isGroupAdmin && !isDeviceAdmin) {
      return false;
    }

    // Check that association is there to delete.
    const deviceUsers = await models.DeviceUsers.findAll({
      where: {
        DeviceId: device.id,
        UserId: userToRemove.id,
      }
    });
    if (deviceUsers.length == 0) {
      return false;
    }
    for (var i in deviceUsers) {
      await deviceUsers[i].destroy();
    }
    return true;
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
      include: [
        {
          model: models.User,
          attributes: ['id', 'username'],
        },
      ],
    });
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields,
      freeDevicename: freeDevicename,
      addUserToDevice: addUserToDevice,
      removeUserFromDevice: removeUserFromDevice,
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
