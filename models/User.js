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
const Op = Sequelize.Op;

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
    superuser: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
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

  //---------------
  // CLASS METHODS
  //---------------
  const models = sequelize.models;

  /* .. */
  User.addAssociations = function(models) {
    models.User.belongsToMany(models.Group, { through: models.GroupUsers });
    models.User.belongsToMany(models.Device, { through: models.DeviceUsers });
  };
  
  /* .. */
  User.getAll = async function(where) {
    return await this.findAll({
      where: where,
      attributes: this.publicFields,
    });
  };

  /* .. */
  User.getFromId = async function(id) {
    return await this.findById(id);
  };

  /* .. */
  User.getFromName = async function(name) {
    return await this.findOne({ where: { username: name }});
  };

  /* .. */
  User.freeUsername = async function(username) {
    var user = await this.findOne({where: {username: username }});
    if (user != null) {
      throw new Error('username in use');
    }
    return true;
  };

  /* .. */
  User.getFromEmail = async function(email) {
    return await this.findOne({where: {email: email}});
  };

  /* .. */
  User.freeEmail = async function(email) {
    email = email.toLowerCase();
    var user = await this.findOne({where: {email: email}});
    if (user) {
      throw new Error('email in use');
    }
    return true;
  };

  //------------------
  // INSTANCE METHODS
  //------------------

  /* .. */
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

  /* .. */
  User.prototype.getWhereDeviceVisible = async function () {
    if (this.superuser) {
      return null;
    }

    var allDeviceIds = await this.getAllDeviceIds();
    return { DeviceId: {[Op.in]: allDeviceIds}};
  };

  /* .. */
  User.prototype.getJwtDataValues = function() {
    return {
      id: this.getDataValue('id'),
      _type: 'user'
    };
  };

  /* .. */
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
            groups: groups
          });
        });
    });
  };

  // Returns the groups that are associated with this user (via
  // GroupUsers).
  User.prototype.getGroupsIds = function() {
    return this.getGroups()
      .then(function(groups) {
        return groups.map(g => g.id);
      });
  };

  // Returns the devices that are directly associated with this user
  // (via DeviceUsers).
  User.prototype.getDeviceIds = function() {
    return this.getDevices()
      .then(function(devices) {
        return devices.map(d => d.id);
      });
  };

  /* .. */
  User.prototype.checkUserControlsDevices = async function(deviceIds) {
    if (!this.superuser) {
      var usersDevices = await this.getAllDeviceIds();

      deviceIds.forEach(deviceId => {
        if (!usersDevices.includes(deviceId)) {
          throw new UnauthorizedDeviceException(this.username, deviceId);
        }
      });
    }
  };

  /* .. */
  User.prototype.getAllDeviceIds = async function() {
    var directDeviceIds = await this.getDeviceIds();
    var groupedDeviceIds = await this.getGroupDeviceIds();

    return directDeviceIds.concat(groupedDeviceIds);
  };

  /* .. */
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

//-----------------
// LOCAL FUNCTIONS
//-----------------

/* .. */
function UnauthorizedDeviceException(username, deviceId) {
  this.name = "UnauthorizedDeviceException";
  this.message = ("Unauthorized use of device " + deviceId + " by " + username);
}

UnauthorizedDeviceException.prototype = new Error();
UnauthorizedDeviceException.prototype.constructor = UnauthorizedDeviceException;

//----------------------
// VALIDATION FUNCTIONS
//----------------------

/* .. */
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

/* .. */
function beforeValidate(user) {
  return new Promise((resolve) => {
    user.setDataValue('email', user.getDataValue('email').toLowerCase());
    resolve();
  });
}
