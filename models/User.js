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
const { AuthorizationError } = require('../api/customErrors');
const log = require('../logging');
const Op = Sequelize.Op;

const PERMISSION_WRITE = 'write';
const PERMISSION_READ = 'read';
const PERMISSION_OFF = 'off';
const PERMISSIONS = Object.freeze([
  PERMISSION_WRITE,
  PERMISSION_READ,
  PERMISSION_OFF,
]);

module.exports = function(sequelize, DataTypes) {
  var name = 'User';

  var attributes = {
    username: {
      type: DataTypes.STRING,
      unique: true
    },
    firstName: {
      type: DataTypes.STRING,
    },
    lastName: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      validate: { isEmail: true },
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    globalPermission: {
      type: DataTypes.ENUM,
      values: PERMISSIONS,
      defaultValue: PERMISSION_OFF,
    },
  };

  var options = {
    hooks: {
      beforeValidate: beforeValidate,
      afterValidate: afterValidate,
    }
  };

  // Define table
  var User = sequelize.define(name, attributes, options);

  User.publicFields = Object.freeze([
    'id',
    'username',
  ]);

  User.apiSettableFields = Object.freeze([
    'firstName',
    'lastName',
    'email'
  ]);

  Object.defineProperty(User, 'GLOBAL_PERMISSIONS', {
    value: PERMISSIONS,
    writable: false,
  });

  //---------------
  // CLASS METHODS
  //---------------
  const models = sequelize.models;

  User.addAssociations = function(models) {
    models.User.belongsToMany(models.Group, { through: models.GroupUsers });
    models.User.belongsToMany(models.Device, { through: models.DeviceUsers });
  };

  User.getAll = async function(where) {
    return await this.findAll({
      where: where,
      attributes: this.publicFields,
    });
  };

  User.getFromId = async function(id) {
    return await this.findByPk(id);
  };

  User.getFromName = async function(name) {
    return await this.findOne({ where: { username: name }});
  };

  User.freeUsername = async function(username) {
    var user = await this.findOne({where: {username: username }});
    if (user != null) {
      throw new Error('Username in use');
    }
    return true;
  };

  User.getFromEmail = async function(email) {
    return await this.findOne({where: {email: email}});
  };

  User.freeEmail = async function(email, userId) {
    email = email.toLowerCase();
    const where = {email: email};
    if (userId) { //Ignore email from this user
      where.id = {[Op.not]: userId};
    }
    var user = await this.findOne({where: where});
    if (user) {
      throw new Error('Email in use');
    }
    return true;
  };

  User.changeGlobalPermission = async function(admin, user, permission) {
    if (!user || !admin || !admin.hasGlobalWrite()) {
      throw new AuthorizationError("User must be an admin with global write permissions");
    }
    user.globalPermission = permission;
    await user.save();
  };

  //------------------
  // INSTANCE METHODS
  //------------------

  User.prototype.hasGlobalWrite = function() {
    return PERMISSION_WRITE == this.globalPermission;
  };

  User.prototype.hasGlobalRead = function() {
    return [PERMISSION_WRITE, PERMISSION_READ].includes(this.globalPermission);
  };

  User.prototype.getGroupDeviceIds = async function() {
    var groupIds = await this.getGroupsIds();
    if (groupIds.length > 0) {
      var devices = await models.Device.findAll({
        where: { GroupId: { [Op.in]: groupIds }},
        attributes: ['id'],
      });
      return devices.map(d => d.id);
    }
    else {
      return [];
    }
  };

  User.prototype.getWhereDeviceVisible = async function () {
    if (this.hasGlobalRead()) {
      return null;
    }

    var allDeviceIds = await this.getAllDeviceIds();
    return { DeviceId: {[Op.in]: allDeviceIds}};
  };

  User.prototype.getJwtDataValues = function() {
    return {
      id: this.getDataValue('id'),
      _type: 'user'
    };
  };

  User.prototype.getDataValues = function() {
    var user = this;
    return new Promise(function(resolve) {
      user.getGroups()
        .then(function(groups) {
          resolve({
            id: user.getDataValue('id'),
            username: user.getDataValue('username'),
            firstName: user.getDataValue('firstName'),
            lastName: user.getDataValue('lastName'),
            email: user.getDataValue('email'),
            groups: groups,
            globalPermission: user.getDataValue('globalPermission'),
          });
        });
    });
  };

  // Returns the groups that are associated with this user (via
  // GroupUsers).
  User.prototype.getGroupsIds = async function() {
    const groups = await this.getGroups();
    return groups.map(g => g.id);
  };

  User.prototype.isInGroup = async function(groupId) {
    const groupIds = await this.getGroupsIds();
    return groupIds.includes(groupId);
  };

  // Returns the devices that are directly associated with this user
  // (via DeviceUsers).
  User.prototype.getDeviceIds = async function() {
    const devices = await this.getDevices();
    return devices.map(d => d.id);
  };

  User.prototype.canAccessDevice = async function(deviceId) {
    const deviceIds = await this.getDeviceIds();
    return deviceIds.includes(deviceId);
  };

  User.prototype.checkUserControlsDevices = async function(deviceIds) {
    if (!this.hasGlobalWrite()) {
      var usersDevices = await this.getAllDeviceIds();

      deviceIds.forEach(deviceId => {
        if (!usersDevices.includes(deviceId)) {
          log.info("Attempted unauthorized use of device " + deviceId + " by " + this.username);
          throw new AuthorizationError("User is not authorized for one (or more) of specified devices.");
        }
      });
    }
  };

  User.prototype.getAllDeviceIds = async function() {
    const directDeviceIds = await this.getDeviceIds();
    const groupedDeviceIds = await this.getGroupDeviceIds();
    return directDeviceIds.concat(groupedDeviceIds);
  };

  User.prototype.comparePassword = function(password) {
    var user = this;
    return new Promise(function(resolve, reject) {
      bcrypt.compare(password, user.password, function(err, isMatch) {
        if (err) {
          reject(err);
        } else {
          resolve(isMatch);
        }
      });
    });
  };

  return User;
};

//----------------------
// VALIDATION FUNCTIONS
//----------------------

function afterValidate(user) {
  // TODO see if this can be done elsewhere, or when just validating the password.
  return new Promise(function(resolve, reject) {
    bcrypt.hash(user.password, 10, function(err, hash) {
      if (err) {
        reject(err);
      } else {
        user.password = hash;
        resolve();
      }
    });
  });
}

function beforeValidate(user) {
  return new Promise((resolve) => {
    user.setDataValue('email', user.getDataValue('email').toLowerCase());
    resolve();
  });
}
