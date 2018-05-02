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
    if (!(await device.userPermissions(authUser)).canAddUsers) {
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
    if (!(await device.userPermissions(authUser)).canRemoveUsers) {
      return false;
    }

    // Check that association is there to delete.
    const deviceUsers = await models.DeviceUsers.findAll({
      where: {
        DeviceId: device.id,
        UserId: userToRemove.id,
      }
    });
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
        include: [
          {
            model: models.User,
            attributes: ['id', 'username'],
          },
        ],
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

  const userPermissions = async function(user) {
    if (user.superuser) {
      return newUserPermissions(true);
    }

    const isGroupAdmin = await models.GroupUsers.isAdmin(this.groupId, user.id);
    const isDeviceAdmin = await models.DeviceUsers.isAdmin(this.id, user.id);
    return newUserPermissions(isGroupAdmin || isDeviceAdmin);
  };


  const newUserPermissions = function(enabled) {
    return {
      canAddUsers: enabled,
      canRemoveUsers: enabled,
    };
  };

  const freeDevicename = async function(devicename) {
    var device = await this.findOne({where: { devicename:devicename }});
    if (device != null) {
      throw new Error('device name in use');
    }
    return true;
  };

  const getFromId = async function(id) {
    return await this.findById(id);
  };

  const getFromName = async function(name) {
    return await this.findOne({ where: { devicename: name }});
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields,
      freeDevicename: freeDevicename,
      addUserToDevice: addUserToDevice,
      allForUser: allForUser,
      removeUserFromDevice: removeUserFromDevice,
      getFromId: getFromId,
      getFromName: getFromName,
    },
    instanceMethods: {
      comparePassword: comparePassword,
      getJwtDataValues: getJwtDataValues,
      userPermissions: userPermissions,
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

function getJwtDataValues() {
  return {
    id: this.getDataValue('id'),
    _type: 'device'
  };
}

function addAssociations(models) {
  models.Device.hasMany(models.AudioRecording);
  models.Device.hasMany(models.Recording);
  models.Device.hasMany(models.Event);
  models.Device.belongsToMany(models.User, { through: models.DeviceUsers });
  models.Device.belongsTo(models.Schedule);
}

function afterValidate(device) {

  // TODO Make the password be hashed when the device password is set not in the validation.
  // TODO or make a custome validation for the password.
  return new Promise(function(resolve, reject) {
    bcrypt.hash(device.password, 10, function(err, hash) {
      if (err)
      {reject(err);}
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
