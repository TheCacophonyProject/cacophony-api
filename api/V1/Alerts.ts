/*
cacophony-api: The Cacophony Project API server
Copyright (C) 2020  The Cacophony Project

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
import { Alert, AlertCondition, isAlertCondition } from "../../models/Alert";

const DEFAULT_FREQUENCY = 60 * 30; //30 minutes

export default function (app: Application, baseUrl: string) {
  const apiUrl = `${baseUrl}/alerts`;

  /**
   * @api {post} /api/v1/alerts Create a new alert
   * @apiName PostAlert
   * @apiGroup Alert
   *
   * @apiDescription Creates a new alert with the user used in the JWT as the admin.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {JSON} alert Alert
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {number} id Unique id of the newly created alert.

   * @apiUse V1ResponseError
   */
  app.post(
    apiUrl,
    [auth.authenticateUser],
    middleware.parseJSON("alert", body),
    middleware.requestWrapper(async (request, response) => {
      if (!request.user.canAccessDevice(request.body.alert.DeviceId)) {
        responseUtil.send(response, {
          statusCode: 400,
          messages: ["No device found."]
        });
        return;
      }
      for (const condition of request.body.alert.conditions) {
        if (!isAlertCondition(condition)) {
          responseUtil.send(response, {
            statusCode: 400,
            messages: ["Bad condition."]
          });
          return;
        }
      }

      request.body.alert.UserId = request.user.id;
      if (
        request.body.alert.frequencySeconds == undefined ||
        request.body.alert.frequencySeconds == null
      ) {
        request.body.alert.frequencySeconds = DEFAULT_FREQUENCY;
      }
      const newAlert = await models.Alert.create(request.body.alert);
      return responseUtil.send(response, {
        id: newAlert.id,
        statusCode: 200,
        messages: ["Created new Alert."]
      });
    })
  );

  /**
   * @api {get} /api/v1/alerts Get Alerts
   * @apiName GetAlerts
   * @apiGroup Alert
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
        null,
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
   * @apiGroup Alert
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
