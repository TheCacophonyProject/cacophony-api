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
    [
      auth.authenticateUser,
      middleware.getDeviceById(body),
      auth.userCanAccessDevices
    ],
    body("name").isString(),
    middleware.parseJSON("conditions", body),
    body("frequencySeconds").toInt().optional(),
    middleware.getDeviceById(body),
    middleware.requestWrapper(async (request, response) => {
      if (!Array.isArray(request.body.conditions)) {
        responseUtil.send(response, {
          statusCode: 400,
          messages: ["Expecting array of conditions."]
        });
        return;
      }
      for (const condition of request.body.conditions) {
        if (!isAlertCondition(condition)) {
          responseUtil.send(response, {
            statusCode: 400,
            messages: ["Bad condition."]
          });
          return;
        }
      }
      if (
        request.body.frequencySeconds == undefined ||
        request.body.frequencySeconds == null
      ) {
        request.body.frequencySeconds = DEFAULT_FREQUENCY;
      }
      const newAlert = await models.Alert.create({
        name: request.body.name,
        conditions: request.body.conditions,
        frequencySeconds: request.body.frequencySeconds,
        UserId: request.user.id,
        DeviceId: request.body.device.id
      });
      return responseUtil.send(response, {
        id: newAlert.id,
        statusCode: 200,
        messages: ["Created new Alert."]
      });
    })
  );

  /**
   * @api {get} /api/v1/alerts/device/:deviceId Get Alerts
   * @apiName GetAlerts
   * @apiGroup Alert
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiParam {number} deviceId of the device to get alerts for
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {Alerts[]} Alerts Array of Alerts
   *
   * @apiUse V1ResponseError
   */
  app.get(
    `${apiUrl}/device/:deviceId`,
    [
      auth.authenticateUser,
      middleware.getDeviceById(param),
      auth.userCanAccessDevices
    ],
    middleware.requestWrapper(async (request, response) => {
      const Alerts = await models.Alert.query(
        { DeviceId: request.body.device.id },
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
}
