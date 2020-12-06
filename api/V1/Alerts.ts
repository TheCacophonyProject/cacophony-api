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

import middleware from "../middleware";
import auth from "../auth";
import models from "../../models";
import responseUtil from "./responseUtil";
import { body, param, query } from "express-validator/check";
import { Application } from "express";

export default function (app: Application, baseUrl: string) {
  const apiUrl = `${baseUrl}/alerts`;

  /**
   * @api {post} /api/v1/alerts Create a new alert
   * @apiName PostAlert
   * @apiAlert Alert
   *
   * @apiDescription Creates a new alert with the user used in the JWT as the admin.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {String} name
   * @apiParam {int} frequency maximum frequency in seconds that an alert will trigger
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {int} id Unique id of the newly created alert.

   * @apiUse V1ResponseError
   */
  app.post(
    apiUrl,
    [auth.authenticateUser],
    body("name").isString(),
    body("frequency").isInt().optional(),
    middleware.requestWrapper(async (request, response) => {
      const newAlert = await models.Alert.newAlert(
        request.body.name,
        request.body.frequency
      );
      await newAlert.addUser(request.user.id, { through: { admin: true } });
      return responseUtil.send(response, {
        id: newAlert.id,
        statusCode: 200,
        messages: ["Created new Alert."]
      });
    })
  );

  /**
   * @api {post} /api/v1/recordings/:id/device Add new device to alert
   * @apiName PostAlertDevice
   * @apiGroup Alerts
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {number} id Id of the alert to add the device to.
   * @apiParam {number} deviceId id of the device
   *
   * @apiUse V1ResponseSuccess
   *
   * @apiUse V1ResponseError
   *
   */
  app.post(
    `${apiUrl}/:id/device`,
    [auth.authenticateUser],
    param("id").isInt().toInt(),
    middleware.getDeviceById(body),
    middleware.requestWrapper(async (request, response) => {
      const alert = await models.Alert.getFromId(
        request.params.id,
        request.user
      );
      if (!alert) {
        responseUtil.send(response, {
          statusCode: 400,
          messages: ["No such alert."]
        });
        return;
      }
      await alert.addDevice(request.body.device.id);

      responseUtil.send(response, {
        statusCode: 200,
        messages: ["Alert Device added."]
      });
    })
  );
  /**
   * @api {get} /api/v1/alerts Get Alerts
   * @apiName GetAlerts
   * @apiAlert Alert
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {JSON} where [Sequelize where conditions](http://docs.sequelizejs.com/manual/tutorial/querying.html#where) for query.
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {Alerts[]} Alerts Array of Alerts
   *
   * @apiUse V1ResponseError
   */
  app.get(
    apiUrl,
    [auth.authenticateUser],
    middleware.requestWrapper(async (request, response) => {
      const Alerts = await models.Alert.query(
        request.query.where,
        request.user,
        null
      );
      return responseUtil.send(response, {
        statusCode: 200,
        messages: [],
        Alerts
      });
    })
  );

  /**
   * @api {get} /api/v1/alerts/:id Get Alert
   * @apiName GetAlert
   * @apiAlert Alert
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {number} id of the alert to retrieve
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {Alert} requested alert
   *
   * @apiUse V1ResponseError
   */
  app.get(
    `${apiUrl}/:id`,
    [auth.authenticateUser],
    param("id").isInt(),
    middleware.requestWrapper(async (request, response) => {
      const alert = await models.Alert.getFromId(
        request.params.id,
        request.user
      );

      if (!alert) {
        responseUtil.send(response, {
          statusCode: 400,
          messages: ["No such alert."]
        });
        return;
      }

      return responseUtil.send(response, {
        statusCode: 200,
        messages: [],
        alert
      });
    })
  );
}
