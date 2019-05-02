/*
cacophony-api: The Cacophony Project API server
Copyright (C) 2018  The Cacophony Project

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var bcrypt = require('bcrypt');
var Sequelize = require('sequelize');
const {AuthorizationError} = require("../api/customErrors");
const Op = Sequelize.Op;

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

  var options = {
    hooks: {
      afterValidate: afterValidate
    }
  };

  var Device = sequelize.define(name, attributes, options);



  //---------------
  // CLASS METHODS
  //---------------
  const models = sequelize.models;

  Device.addAssociations = function(models) {
    models.Device.hasMany(models.Recording);
    models.Device.hasMany(models.Event);
    models.Device.belongsToMany(models.User, { through: models.DeviceUsers });
    models.Device.belongsTo(models.Schedule);
  };

  /**
  * Adds/update a user to a Device, if the given user has permission to do so.
  * The authenticated user must either be admin of the group that the device
  * belongs to, an admin of that device, or have global write permission.
  */
  Device.addUserToDevice = async function(authUser, device, userToAdd, admin) {
    if (device == null || userToAdd == null) {
      return false;
    }
    if (!(await device.userPermissions(authUser)).canAddUsers) {
      throw new AuthorizationError("User is not a group, device, or global admin so cannot add users to this device");
    }

    // Get association if already there and update it.
    var deviceUser = await models.DeviceUsers.findOne({
      where: {
        DeviceId: device.id,
        UserId: userToAdd.id,
      }
    });
    if (deviceUser != null) {
      deviceUser.admin = admin; // Update admin value.
      await deviceUser.save();
      return true;
    }

    await device.addUser(userToAdd.id, {through: {admin: admin}});
    return true;
  };

  /**
   * Removes a user from a Device, if the given user has permission to do so.
   * The user must be a group or device admin, or have global write permission to do this. .
   */
  Device.removeUserFromDevice = async function(authUser, device, userToRemove) {
    if (device == null || userToRemove == null) {
      return false;
    }
    if (!(await device.userPermissions(authUser)).canRemoveUsers) {
      throw new AuthorizationError("User is not a group, device, or global admin so cannot remove users from this device");
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

  Device.onlyUsersDevicesMatching = async function (user, conditions = null, includeData = null) {
    // Return all devices if user has global write/read permission.
    if (user.hasGlobalRead()) {
      return this.findAndCountAll({
        where: conditions,
        attributes: ["devicename", "id"],
        include: includeData,
        order: ['devicename'],
      });
    }

    var deviceIds = await user.getDeviceIds();
    var userGroupIds = await user.getGroupsIds();

    const usersDevice = { [Op.or]: [
      {GroupId: {[Op.in]: userGroupIds}},
      {id: {[Op.in]: deviceIds}},
    ]};

    return this.findAndCountAll({
      where: { [Op.and]: [usersDevice, conditions] },
      attributes: ["devicename", "id"],
      order: ['devicename'],
      include: includeData,
    });
  };

  Device.allForUser = async function(user) {
    const includeData = [
      {
        model: models.User,
        attributes: ['id', 'username'],
      },
    ];

    return this.onlyUsersDevicesMatching(user, null, includeData);
  };

  Device.newUserPermissions = function(enabled) {
    return {
      canListUsers: enabled,
      canAddUsers: enabled,
      canRemoveUsers: enabled,
    };
  };

  Device.freeDevicename = async function(devicename) {
    var device = await this.findOne({where: { devicename:devicename }});
    if (device != null) {
      throw new Error('device name in use');
    }
    return true;
  };

  Device.getFromId = async function(id) {
    return await this.findById(id);
  };

  Device.getFromName = async function(name) {
    return await this.findOne({ where: { devicename: name }});
  };

  // Fields that are directly settable by the API.
  Device.apiSettableFields = [
    'location',
    'newConfig'
  ];

  //------------------
  // INSTANCE METHODS
  //------------------

  Device.prototype.userPermissions = async function(user) {
    if (user.hasGlobalWrite()) {
      return Device.newUserPermissions(true);
    }

    const isGroupAdmin = await models.GroupUsers.isAdmin(this.GroupId, user.id);
    const isDeviceAdmin = await models.DeviceUsers.isAdmin(this.id, user.id);
    return Device.newUserPermissions(isGroupAdmin || isDeviceAdmin);
  };

  Device.prototype.getJwtDataValues = function() {
    return {
      id: this.getDataValue('id'),
      _type: 'device'
    };
  };

  Device.prototype.comparePassword = function(password) {
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
  };

  // Returns users that have access to this device either via group
  // membership or direct assignment. By default, only "safe" user
  // attributes are returned.
  Device.prototype.users = async function(authUser, attrs = ['id', 'username', 'email']) {
    if (!(await this.userPermissions(authUser)).canListUsers) {
      return [];
    }

    const device_users = await this.getUsers({ attributes: attrs });
    const group = await models.Group.getFromId(this.GroupId);
    const group_users = await group.getUsers({ attributes: attrs });

    return device_users.concat(group_users);
  };

  return Device;
};

/********************/
/* Validation methods */
/********************/

function afterValidate(device) {

  if (device.password !== undefined) {
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
}
