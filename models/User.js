var bcrypt = require('bcrypt');

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
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields
    },
    instanceMethods: {
      comparePassword: comparePassword,
      getGroupsIds: getGroupsIds,
      getJwtDataValues: getJwtDataValues,
      getDataValues: getDataValues
    },
    hooks: {
      afterValidate: afterValidate
    }
  };
  // Define table
  return sequelize.define(name, attributes, options);
};

var apiSettableFields = [
  'firstName',
  'lastName'
];

function getJwtDataValues() {
  return {
    id: this.getDataValue('id'),
    _type: 'user'
  };
}

function getDataValues() {
  var user = this;
  return new Promise(function(resolve, reject) {
    user.getGroups()
      .then(function(groups) {
        resolve({
          username: user.getDataValue('username'),
          firstName: user.getDataValue('firstName'),
          lastName: user.getDataValue('lastName'),
          email: user.getDataValue('email'),
          groups: groups
        });
      });
  });
}

function addAssociations(models) {
  models.User.belongsToMany(models.Group, { through: models.GroupUsers });
  models.User.belongsToMany(models.Device, { through: models.DeviceUsers });
}

function getGroupsIds() {
  return this.getGroups()
    .then(function(groups) {
      var idList = [];
      for (var key in groups) { idList.push(groups[key].dataValues.id); }
      return idList;
    });
}

function afterValidate(user) {
  // TODO see if thsi can be done elsewhere, or when just validating the password.
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

function comparePassword(password) {
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
}
