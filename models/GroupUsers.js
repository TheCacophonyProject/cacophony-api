module.exports = function(sequelize, DataTypes) {
  return sequelize.define("GroupUsers", {
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    classMethods: {
      addAssociations: addAssociations,
    }
  })
}

function addAssociations(models) {
}
