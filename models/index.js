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

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(module.filename);
const config = require('../config');
const log = require('../logging');

const dbConfig = config.database;

// Have sequelize send us query execution timings
dbConfig.benchmark = true;

// Send logs via winston
dbConfig.logging = function(msg, timeMs) {
  log.debug("%s [%d ms]", msg, timeMs);
};

// define the aliases that are currently used
// todo: replace all use with symbol-based operators
const Op = Sequelize.Op;
const aliases = {
  $eq: Op.eq,
  $gte: Op.gte,
  $in: Op.in,
  $and: Op.and,
  $or: Op.or,
};

dbConfig.operatorsAliases = aliases;

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig,
);

const db = {};

fs.readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) &&
      (file !== basename) &&
      (file.slice(-3) === '.js');
  })
  .forEach(function(file) {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if (db[modelName].addAssociations) {
    db[modelName].addAssociations(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
