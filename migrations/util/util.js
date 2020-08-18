"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });

function migrationAddBelongsTo(queryInterface, childTable, parentTable, opts) {
  if (!opts) {
    opts = {};
  }
  if (opts === "strict") {
    opts = {
      notNull: true,
      cascade: true
    };
  }
  let columnName = `${parentTable.substring(0, parentTable.length - 1)}Id`;
  if (opts.name) {
    columnName = `${opts.name}Id`;
  }
  const constraintName = `${childTable}_${columnName}_fkey`;
  let deleteBehaviour = "SET NULL";
  if (opts.cascade) {
    deleteBehaviour = "CASCADE";
  }
  let columnNull = "";
  if (opts.notNull) {
    columnNull = "NOT NULL";
  }
  return new Promise(function (resolve, reject) {
    queryInterface.sequelize
      .query(
        `ALTER TABLE "${childTable}" ADD COLUMN "${columnName}" INTEGER ${columnNull};`
      )
      .then(() => {
        return queryInterface.sequelize.query(
          `ALTER TABLE "${childTable}" ADD CONSTRAINT "${constraintName}" FOREIGN KEY ("${columnName}") REFERENCES "${parentTable}" (id) ON DELETE ${deleteBehaviour} ON UPDATE CASCADE;`
        );
      })
      .then(() => resolve())
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}
exports.migrationAddBelongsTo = migrationAddBelongsTo;
function renameTableAndIdSeq(queryInterface, oldName, newName) {
  return Promise.all([
    queryInterface.sequelize.query(
      `ALTER TABLE "${oldName}" RENAME TO "${newName}";`
    ),
    queryInterface.sequelize.query(
      `ALTER TABLE "${oldName}_id_seq" RENAME TO "${newName}_id_seq";`
    )
  ]);
}
exports.renameTableAndIdSeq = renameTableAndIdSeq;
function migrationRemoveBelongsTo(
  queryInterface,
  childTable,
  parentTable,
  opts = {}
) {
  let columnName = `${parentTable.substring(0, parentTable.length - 1)}Id`;
  if (opts.name) {
    columnName = `${opts.name}Id`;
  }
  return queryInterface.sequelize.query(
    `ALTER TABLE "${childTable}" DROP COLUMN "${columnName}";`
  );
}
exports.migrationRemoveBelongsTo = migrationRemoveBelongsTo;
function belongsToMany(queryInterface, viaTable, table1, table2) {
  const columnName1 = `${table1.substring(0, table1.length - 1)}Id`;
  const constraintName1 = `${viaTable}_${columnName1}_fkey`;
  const columnName2 = `${table2.substring(0, table2.length - 1)}Id`;
  const constraintName2 = `${viaTable}_${columnName2}_fkey`;
  console.log("Adding belongs to many columns.");
  return new Promise(function (resolve, reject) {
    Promise.all([
      queryInterface.sequelize.query(
        `ALTER TABLE "${viaTable}" ADD COLUMN "${columnName1}" INTEGER;`
      ),
      queryInterface.sequelize.query(
        `ALTER TABLE "${viaTable}" ADD COLUMN "${columnName2}" INTEGER;`
      )
    ])
      .then(() => {
        console.log("Adding belongs to many constraint.");
        return Promise.all([
          queryInterface.sequelize.query(
            `ALTER TABLE "${viaTable}" ADD CONSTRAINT "${constraintName1}" FOREIGN KEY ("${columnName1}") REFERENCES "${table1}" (id) ON DELETE CASCADE ON UPDATE CASCADE;`
          ),
          queryInterface.sequelize.query(
            `ALTER TABLE "${viaTable}" ADD CONSTRAINT "${constraintName2}" FOREIGN KEY ("${columnName2}") REFERENCES "${table2}" (id) ON DELETE CASCADE ON UPDATE CASCADE;`
          )
        ]);
      })
      .then(() => resolve())
      .catch((err) => reject(err));
  });
}
exports.belongsToMany = belongsToMany;
function addSerial(queryInterface, tableName) {
  return queryInterface.sequelize.query(
    `ALTER TABLE "${tableName}" ADD COLUMN id SERIAL PRIMARY KEY;`
  );
}
exports.addSerial = addSerial;
exports.default = {
  migrationAddBelongsTo,
  migrationRemoveBelongsTo,
  belongsToMany,
  addSerial,
  renameTableAndIdSeq
};
