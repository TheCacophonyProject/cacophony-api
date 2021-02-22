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
import config from "../config";
import Sequelize from "sequelize";
import path from "path";
import fs from "fs";
import log from "../logging";
import { AlertStatic } from "./Alert";
import { UserStatic } from "./User";
import { TagStatic } from "./Tag";
import { RecordingStatic } from "./Recording";
import { TrackTagStatic } from "./TrackTag";
import { TrackStatic } from "./Track";
import { DetailSnapshotStatic } from "./DetailSnapshot";
import { FileStatic } from "./File";
import { EventStatic } from "./Event";
import { DeviceStatic } from "./Device";
import { GroupStatic } from "./Group";
import { GroupUsersStatic } from "./GroupUsers";
import { DeviceUsersStatic } from "./DeviceUsers";
import { ScheduleStatic } from "./Schedule";
import { StationStatic } from "./Station";

const basename = path.basename(module.filename);
const dbConfig = config.database;

// Have sequelize send us query execution timings
dbConfig.benchmark = true;

// Send logs via winston
(dbConfig as any).logging = function (msg, timeMs) {
  log.debug("%s [%d ms]", msg, timeMs);
};

// String-based operators are deprecated in sequelize v4 as a security concern.
// http://docs.sequelizejs.com/manual/tutorial/querying.html#operators-security
// Because they are currently used via the API, we need to keep them enabled.
// The following definition explicitly enables the aliases we want to support.
const Op = Sequelize.Op;

// @ts-ignore
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    ...dbConfig,
    logQueryParameters: true,
    operatorsAliases: {
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
    }
  }
);

const db: Record<string, any> = {};

fs.readdirSync(__dirname)
  .filter((file) => {
    return file.indexOf(".") !== 0 && file !== basename && file.endsWith(".js");
  })
  .forEach((file) => {
    const model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].addAssociations) {
    db[modelName].addAssociations(db);
  }
});

export interface ModelCommon<T> extends Sequelize.Model {
  getJwtDataValues: () => { _type: string; id: any };
}
export interface ModelStaticCommon<T> extends Sequelize.ModelCtor<any> {
  getFromName: (name: string) => Promise<T | null>;
  publicFields: readonly string[];
  apiSettableFields: readonly string[];
  addAssociations: (models: Record<string, ModelStaticCommon<any>>) => void;
  userGetAttributes: readonly string[];
  getDataValue: (fieldName: string) => any;
}

const AllModels = {
  ...db,
  User: db.User as UserStatic,
  Recording: db.Recording as RecordingStatic,
  Tag: db.Tag as TagStatic,
  TrackTag: db.TrackTag as TrackTagStatic,
  Track: db.Track as TrackStatic,
  DetailSnapshot: db.DetailSnapshot as DetailSnapshotStatic,
  File: db.File as FileStatic,
  Event: db.Event as EventStatic,
  Device: db.Device as DeviceStatic,
  Group: db.Group as GroupStatic,
  Station: db.Station as StationStatic,
  GroupUsers: db.GroupUsers as GroupUsersStatic,
  DeviceUsers: db.DeviceUsers as DeviceUsersStatic,
  Schedule: db.Schedule as ScheduleStatic,
  Alert: db.Alert as AlertStatic,
  sequelize,
  Sequelize
};

export default AllModels;
