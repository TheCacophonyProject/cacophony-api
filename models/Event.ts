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
import { DeviceId, Device } from "./Device";
import { User } from "./User";
import { DetailSnapShot } from "./DetailSnapshot";

const Op = Sequelize.Op;

export interface Event extends Sequelize.Model, ModelCommon<Event> {
  id: number;
  dateTime: Date;
  EventDetailId: number;
  EventDetail: DetailSnapShot;
  DeviceId: DeviceId;
  dataValues: any;
  Device: Device | null;

  create: ({
    deviceId,
    eventDetailId,
    dateTime
  }: {
    deviceId: number;
    eventDetailId: number;
    dateTime: Date;
  }) => Promise<Event>;
}

export interface QueryOptions {
  eventType: string | string[];
  admin: boolean;
  useCreatedDate: boolean;
}

export interface EventStatic extends ModelStaticCommon<Event> {
  query: (
    user: User,
    startTime: string | null | undefined,
    endTime: string | null | undefined,
    deviceId: DeviceId | null | undefined,
    offset: number | null | undefined,
    limit: number | null | undefined,
    latest: boolean | null | undefined,
    options?: QueryOptions
  ) => Promise<{ rows: Event[]; count: number }>;
  latestEvents: (
    user: User,
    deviceId: DeviceId | null | undefined,
    options?: QueryOptions
  ) => Promise<Event[]>;
}

export default function (sequelize, DataTypes) {
  const name = "Event";

  const attributes = {
    dateTime: DataTypes.DATE
  };

  const Event = sequelize.define(name, attributes) as unknown as EventStatic;

  //---------------
  // CLASS METHODS
  //---------------
  const models = sequelize.models;

  Event.addAssociations = function (models) {
    models.Event.belongsTo(models.DetailSnapshot, {
      as: "EventDetail",
      foreignKey: "EventDetailId"
    });
    models.Event.belongsTo(models.Device);
  };

  /**
   * Return one or more recordings for a user matching the query
   * arguments given.
   */
  Event.query = async function (
    user,
    startTime,
    endTime,
    deviceId,
    offset,
    limit,
    latestFirst,
    options
  ) {
    const where: any = {};
    offset = offset || 0;
    limit = limit || 100;

    if (startTime || endTime) {
      let dateTime;
      if (options && options.useCreatedDate) {
        dateTime = where.createdAt = {};
      } else {
        dateTime = where.dateTime = {};
      }
      if (startTime) {
        dateTime[Op.gte] = startTime;
      }
      if (endTime) {
        dateTime[Op.lt] = endTime;
      }
    }

    if (deviceId) {
      where.DeviceId = deviceId;
    }
    const eventWhere: any = {};
    if (options && options.eventType) {
      if (Array.isArray(options.eventType)) {
        eventWhere.type = {};
        eventWhere.type[Op.in] = options.eventType;
      } else {
        eventWhere.type = options.eventType;
      }
    }

    let order: any[] = ["dateTime"];
    if (latestFirst) {
      order = [["dateTime", "DESC"]];
    }

    return this.findAndCountAll({
      where: {
        [Op.and]: [
          where, // User query
          options && options.admin ? "" : await user.getWhereDeviceVisible() // can only see devices they should
        ]
      },
      order: order,
      include: [
        {
          model: models.DetailSnapshot,
          as: "EventDetail",
          attributes: ["type", "details"],
          where: eventWhere
        },
        {
          model: models.Device,
          attributes: ["devicename"]
        }
      ],
      attributes: { exclude: ["updatedAt", "EventDetailId"] },
      limit: limit,
      offset: offset
    });
  };

  /**
   * Return the latest event of each type grouped by device id
   */
  Event.latestEvents = async function (user, deviceId, options) {
    const where: any = {};

    if (deviceId) {
      where.DeviceId = deviceId;
    }
    const eventWhere: any = {};
    if (options && options.eventType) {
      if (Array.isArray(options.eventType)) {
        eventWhere.type = {};
        eventWhere.type[Op.in] = options.eventType;
      } else {
        eventWhere.type = options.eventType;
      }
    }

    let order: any[] = [
      ["EventDetail", "type", "DESC"],
      ["DeviceId", "DESC"],
      ["dateTime", "DESC"]
    ];

    return this.findAll({
      where: {
        [Op.and]: [
          where, // User query
          options && options.admin ? "" : await user.getWhereDeviceVisible() // can only see devices they should
        ]
      },
      order: order,
      include: [
        {
          model: models.DetailSnapshot,
          as: "EventDetail",
          attributes: ["type", "details"],
          where: eventWhere
        },
        {
          model: models.Device,
          attributes: ["id", "devicename", "GroupId"],
          include: [
            {
              model: models.Group,
              attributes: ["groupname", "id"]
            }
          ]
        }
      ],
      attributes: [
        Sequelize.literal(
          'DISTINCT ON("Event"."DeviceId","EventDetail"."type") 1'
        ), // the 1 is some kind of hack that makes this work in sequelize
        "id",
        "dateTime",
        "DeviceId"
      ]
    });
  };
  return Event;
}
