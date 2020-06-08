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
import { body } from "express-validator/check";
import auth from "../auth";
import responseUtil from "./responseUtil";
import { Application } from "express";

export default function (app: Application) {
  /**
   * @api {post} /authenticate_device/ Authenticate a device
   * @apiName AuthenticateDevice
   * @apiGroup Authentication
   * @apiDescription Checks the username corresponds to an existing device account
   * and the password matches the account.
   *
   * @apiParam {String} devicename The name identifying a valid device account
   * @apiParam {String} groupname The name identifying a valid device account
   * @apiParam {String} password Password for the device account
   *
   * @apiSuccess {String} token JWT string to provide to further API requests
   * @apiSuccess {int} id of device authenticated
   */
  app.post(
    "/authenticate_device",
    [body("password").exists(), middleware.getDevice(body)],
    middleware.requestWrapper(async (request, response) => {
      const passwordMatch = await request.body.device.comparePassword(
        request.body.password
      );
      if (passwordMatch) {
        return responseUtil.send(response, {
          statusCode: 200,
          messages: ["Successful login."],
          id: request.body.device.id,
          token: "JWT " + auth.createEntityJWT(request.body.device)
        });
      } else {
        return responseUtil.send(response, {
          statusCode: 401,
          messages: ["Wrong password or devicename."]
        });
      }
    })
  );
}
