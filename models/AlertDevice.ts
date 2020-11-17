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
export type AlertDeviceId = number;

export interface AlertDevice extends Sequelize.Model, ModelCommon<AlertDevice> {
  id: AlertDeviceId;
}
export interface AlertDeviceStatic extends ModelStaticCommon<AlertDevice> {
  getFromId: (id: AlertDeviceId) => Promise<AlertDevice>;
}

export default function (sequelize, DataTypes): AlertDeviceStatic {
  const name = "AlertDevice";

  const attributes = {
    AlertDeviceName: {
      type: DataTypes.STRING,
      unique: true
    }
  };

  const AlertDevice = (sequelize.define(
    name,
    attributes
  ) as unknown) as AlertDeviceStatic;

  AlertDevice.apiSettableFields = [];

  //---------------
  // Class methods
  //---------------
  const models = sequelize.models;

  AlertDevice.getFromId = async function (id) {
    return this.findByPk(id);
  };

  return AlertDevice;
}
