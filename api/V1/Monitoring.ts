/*
cacophony-api: The Cacophony Project API server
Copyright (C) 2021  The Cacophony Project

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

import middleware, { toIdArray, toDateInMillisecs }  from "../middleware";
import auth from "../auth";
import e, { Application } from "express";
import {getMonitoringPageCriteria, MonitoringParams}  from "./monitoringPage";
import {generateVisits}  from "./monitoringVisit";
import responseUtil from "./responseUtil";
import { query } from "express-validator/check";

export default function (app: Application, baseUrl: string) {
  const apiUrl = `${baseUrl}/monitoring`;

    /**
     * @api {get} /api/v1/monitoring Query monitoring records
     * @apiName QueryMonitoring
     * @apiGroup Monitoring
     *
     * @apiUse V1UserAuthorizationHeader
     * @apiUse V1ResponseSuccessQuery
     * @apiUse V1ResponseError
     */ 
    app.get(
        apiUrl + "/page",
        [auth.authenticateUser, 
        toIdArray("devices").optional(),
        toIdArray("groups").optional(),
        toDateInMillisecs("from").optional(),
        toDateInMillisecs("until").optional(), 
        query("page").isInt(),
        query("page-size").isInt(),
        middleware.isValidName(query, "ai").optional()],
        middleware.requestWrapper(
        async (request: e.Request, response: e.Response) => {
            const user = (request as any).user;
            const params : MonitoringParams  = {
               user, 
               devices: request.query.devices,
               groups: request.query.groups,
               page: request.query.page,
               pageSize: request.query["page-size"]
            }

            if (request.query.from) {
                params.from = new Date(request.query.from);
            }

            if (request.query.until) {
                params.until = new Date(request.query.until);
            }

            const searchDetails = await getMonitoringPageCriteria(params)
            
            const aiModel = request.query["ai"] || "Master";
            const visits = await generateVisits(user, searchDetails, aiModel);
        
            responseUtil.send(response, {
                statusCode: 200,
                messages: ["Completed query."],
                params: searchDetails,
                visits: visits
            });
        }
        )
    );
}

