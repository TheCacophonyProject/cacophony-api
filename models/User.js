var bcrypt = require('bcrypt');

module.exports = function(sequelize, DataTypes) {
  // Define table
  return sequelize.define("User", {
    username: { // Unique username
      type: DataTypes.STRING,
      unique: true
    },
    firstName: DataTypes.STRING, //TODO limit len of this
    lastName: DataTypes.STRING, //TODO limit len of this
    email: {
      type: DataTypes.STRING,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    classMethods: {
      addAssociations: addAssociations,
      apiSettableFields: apiSettableFields
    },
    instanceMethods: {
      comparePassword: comparePassword,
      getGroupsIds: getGroupsIds
    },
    hooks: {
      afterValidate: afterValidate
    }
  })
}

var apiSettableFields = [
  'firstName',
  'lastName'
]

function addAssociations(models) {
  models.User.belongsToMany(models.Group, { through: 'UserGroup' });
  models.User.hasMany(models.Device);
}

function getGroupsIds() {
  return this.getGroups()
    .then(function(groups) {
      var idList = []
      for (key in groups) { idList.push(groups[key].dataValues.id) }
      return idList;
    })
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
    })
  })
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
    })
  })
}
