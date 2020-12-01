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

export interface AlertCondition
  extends Sequelize.Model,
    ModelCommon<AlertCondition> {
  id: number;
}
export interface AlertConditionStatic
  extends ModelStaticCommon<AlertCondition> {
  getFromId: (id: number) => Promise<AlertCondition>;
}

export default function (sequelize, DataTypes): AlertConditionStatic {
  const name = "AlertCondition";

  const attributes = {
    tag: {
      type: DataTypes.STRING
    },
    automatic: {
      type: DataTypes.BOOLEAN
    }
  };

  const AlertCondition = (sequelize.define(
    name,
    attributes
  ) as unknown) as AlertConditionStatic;

  AlertCondition.apiSettableFields = [];

  //---------------
  // Class methods
  //---------------
  const models = sequelize.models;

  AlertCondition.addAssociations = function (models) {
    models.AlertCondition.belongsTo(models.Alert);
  };
  AlertCondition.getFromId = async function (id) {
    return this.findByPk(id);
  };

  return AlertCondition;
}
