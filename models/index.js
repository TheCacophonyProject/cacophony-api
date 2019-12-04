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

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(module.filename);
const config = require("../config");
const log = require("../logging");

const dbConfig = config.database;

// Have sequelize send us query execution timings
dbConfig.benchmark = true;

// Send logs via winston
dbConfig.logging = function(msg, timeMs) {
  log.debug("%s [%d ms]", msg, timeMs);
};

// String-based operators are deprecated in sequelize v4 as a security concern.
// http://docs.sequelizejs.com/manual/tutorial/querying.html#operators-security
// Because they are currently used via the API, we need to keep them enabled.
// The following definition explicitly enables the aliases we want to support.
const Op = Sequelize.Op;
dbConfig.operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $contains: Op.contains,
  $and: Op.and,
  $or: Op.or,
  $any: Op.any,
  $all: Op.all
};

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const db = {};

fs.readdirSync(__dirname)
  .filter(function(file) {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach(function(file) {
    const model = sequelize["import"](path.join(__dirname, file));
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
