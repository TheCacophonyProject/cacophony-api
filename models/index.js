var Sequelize = require('sequelize');
var fs = require('fs');
var path = require('path');
var config = require('../config');
var log = require('../logging');

function sequelizeLog(msg) {
  log.debug(msg, { sequelize: true });
}

var sequelize = new Sequelize(config.db.name, config.db.username, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: config.db.dialect,
  logging: sequelizeLog,
  benchmark: true
});

var models = {};
models.sequelize = sequelize;

var modelFiles = fs.readdirSync(__dirname);
modelFiles.splice(modelFiles.indexOf('index.js'), 1); // Remove self from list.
modelFiles.splice(modelFiles.indexOf('util.js'), 1); // Remove util from list.
for (var i in modelFiles) {
  var model = sequelize.import(path.join(__dirname, modelFiles[i]));
  models[model.name] = model;
}

Object.keys(models).forEach(function(modelName) {
  if ("addAssociations" in models[modelName]) {
    models[modelName].addAssociations(models);
  }
});

module.exports = models;
