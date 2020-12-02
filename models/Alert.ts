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
import { User } from "./User";
import { AlertDevice } from "./AlertDevice";
import { AlertCondition } from "./AlertCondition";
import { AlertLog } from "./AlertLog";
import { Recording } from "./Recording";
import { Track } from "./Track";
import { TrackTag } from "./TrackTag";
import { alertHTML, sendEmail } from "../emailUtil";

const { AuthorizationError } = require("../api/customErrors");
export type AlertId = number;
const Op = Sequelize.Op;

const DEFAULT_FREQUENCY = 60 * 30; //30 minutes
export interface Alert extends Sequelize.Model, ModelCommon<Alert> {
  id: AlertId;
  addUser: (userToAdd: User, through: any) => Promise<void>;
  addDevice: (userToAdd: User, through?: any) => Promise<void>;

  createAlertCondition: ({
    tag: string,
    automatic: boolean
  }) => Promise<AlertCondition>;
  createAlertDevice: ({ deviceId: number }) => Promise<AlertDevice>;
  createAlertLog: ({
    success: boolean,
    to: string,
    sentAt: Date
  }) => Promise<AlertLog>;
  getUsers: () => Promise<User[]>;
}
export interface AlertStatic extends ModelStaticCommon<Alert> {
  query: (
    where: any,
    user: User | null,
    deviceId: number | null,
    condition?: any,
    admin?: boolean
  ) => Promise<any[]>;
  newAlert: (name: String, frequency?: number) => Promise<Alert>;
  getFromId: (id: number, user: User) => Promise<Alert>;
  getAlertsFor: (deviceId: number, what: string) => Promise<any[]>;
  sendAlert: (recording: Recording, track: Track) => Promise<null>;
}

export default function (sequelize, DataTypes): AlertStatic {
  const name = "Alert";

  const attributes = {
    name: {
      type: DataTypes.STRING,
      unique: true
    },
    frequencySeconds: {
      type: DataTypes.INTEGER
    },
    lastAlert: {
      type: DataTypes.DATE
    }
  };

  const Alert = (sequelize.define(name, attributes) as unknown) as AlertStatic;

  Alert.apiSettableFields = [];

  //---------------
  // Class methods
  //---------------
  const models = sequelize.models;

  Alert.addAssociations = function (models) {
    models.Alert.hasMany(models.AlertCondition);
    models.Alert.hasMany(models.AlertLog);
    models.Alert.belongsToMany(models.User, { through: models.UserAlert });
    models.Alert.belongsToMany(models.Device, { through: models.AlertDevice });
  };

  Alert.newAlert = async function (
    name: string,
    frequency: number | null = DEFAULT_FREQUENCY
  ) {
    if (frequency == undefined || frequency == null) {
      frequency = DEFAULT_FREQUENCY;
    }
    return models.Alert.create({
      name: name,
      frequencySeconds: frequency
    });
  };
  Alert.getFromId = async function (id: number, user: User) {
    let userWhere = { id: user.id };
    if (user.hasGlobalRead()) {
      userWhere = null;
    }

    return await models.Alert.findOne({
      where: { id: id },
      include: [
        {
          model: models.User,
          attributes: ["id", "username"],
          where: userWhere
        },
        {
          model: models.AlertLog,
          seperate: true,
          limit: 5,
          order: [["updatedAt", "desc"]]
        },

        { model: models.AlertCondition },
        {
          model: models.Device,
          attributes: ["id", "devicename"]
        }
      ]
    });
  };

  Alert.query = async function (
    where: any,
    user: User | null,
    deviceId: number | null,
    condition: any = {},
    admin: boolean = false
  ) {
    let deviceWhere = null;
    if (deviceId) {
      deviceWhere = { id: deviceId };
    }
    let userWhere = {};
    if (!admin) {
      userWhere = { id: user.id };
      if (user.hasGlobalRead()) {
        userWhere = null;
      }
    }
    return await models.Alert.findAll({
      where: where,
      attributes: ["id", "name", "frequencySeconds"],
      include: [
        {
          model: models.AlertLog,
          seperate: true,
          limit: 5,
          order: [["updatedAt", "desc"]]
        },
        {
          model: models.User,
          attributes: ["id", "username", "email"],
          where: userWhere
        },
        { model: models.AlertCondition, where: condition },
        {
          model: models.Device,
          attributes: ["id", "devicename"],
          where: deviceWhere
        }
      ]
    });
  };

  Alert.getAlertsFor = async function (deviceId: number, what: string) {
    return Alert.query(
      {
        lastAlert: {
          [Op.or]: {
            [Op.eq]: null,
            [Op.lt]: Sequelize.literal(
              `now() - "frequencySeconds" * INTERVAL '1 second'`
            )
          }
        }
      },
      null,
      deviceId,
      { tag: what },
      true
    );
  };

  Alert.prototype.sendAlert = async function (
    recording: Recording,
    track: Track,
    tag: TrackTag
  ) {
    const subject = `${this.name}  - ${tag.what} Detected`;
    const html = alertHTML(recording, tag, this.Devices[0].devicename);
    const alertTime = new Date().toISOString();
    for (const user of this.Users) {
      const result = await sendEmail(html, user.email, subject);
      let sentAt = null;
      if (result) {
        sentAt = alertTime;
      }
      await this.createAlertLog({
        recId: recording.id,
        trackId: track.id,
        success: result,
        to: user.email,
        sentAt: sentAt
      });
    }

    await this.update({ lastAlert: alertTime });
  };

  return Alert;
}
