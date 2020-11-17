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

import Sequelize from "sequelize";
import { ModelCommon, ModelStaticCommon } from "./index";

const { AuthorizationError } = require("../api/customErrors");
export type UserAlertId = number;

export interface UserAlert extends Sequelize.Model, ModelCommon<UserAlert> {
  id: UserAlertId;
}
export interface UserAlertStatic extends ModelStaticCommon<UserAlert> {
  getFromId: (id: UserAlertId) => Promise<UserAlert>;
}

export default function (sequelize, DataTypes): UserAlertStatic {
  const name = "UserAlert";

  const attributes = {};

  const UserAlert = (sequelize.define(
    name,
    attributes
  ) as unknown) as UserAlertStatic;

  UserAlert.apiSettableFields = [];

  //---------------
  // Class methods
  //---------------
  const models = sequelize.models;

  UserAlert.addAssociations = function (models) {};

  UserAlert.getFromId = async function (id) {
    return this.findByPk(id);
  };

  return UserAlert;
}
