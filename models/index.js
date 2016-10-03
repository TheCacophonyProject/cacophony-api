var Sequelize = require('sequelize');
var fs = require('fs');
var path = require('path');

var sequelize = new Sequelize('cacophony_metadata', 'test', 'pass', {
  host: '192.168.33.10',
  port: '5432',
  dialect: 'postgres'
});

var models = {};
models.sequelize = sequelize;

var modelFiles = fs.readdirSync(__dirname);
modelFiles.splice(modelFiles.indexOf('index.js'), 1);  // Remove self from list.
//modelFiles.splice(modelFiles.indexOf('util.js'), 1);   // Remove util from list.
for (i in modelFiles) {
  var model = sequelize.import(path.join(__dirname, modelFiles[i]));
  models[model.name] = model
}

Object.keys(models).forEach(function(modelName) {
  if ("addAssociations" in models[modelName]) {
    models[modelName].addAssociations(models)
  }
})

module.exports = models;
