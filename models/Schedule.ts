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

import _ from "lodash";
import { ModelCommon, ModelStaticCommon } from "./index";
import Sequelize from "sequelize";
import { UserId } from "./User";

export type ScheduleId = number;
export interface Schedule extends Sequelize.Model, ModelCommon<Schedule> {
  id: ScheduleId;
  UserId: UserId;
}

export interface ScheduleStatic extends ModelStaticCommon<Schedule> {
  buildSafely: (fields: any) => Schedule;
}

export default function (sequelize, DataTypes): ScheduleStatic {
  const name = "Schedule";

  const attributes = {
    schedule: DataTypes.JSONB,
  };

  const Schedule = sequelize.define(name, attributes);

  //---------------
  // CLASS METHODS
  //---------------

  Schedule.buildSafely = function (fields) {
    return Schedule.build(_.pick(fields, ["schedule"]));
  };

  Schedule.addAssociations = function (models) {
    models.Schedule.belongsTo(models.User);
    models.Schedule.hasMany(models.Device);
  };

  return Schedule;
}
