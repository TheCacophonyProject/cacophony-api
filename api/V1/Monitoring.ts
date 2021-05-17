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

import middleware, { toIdArray, toDate }  from "../middleware";
import auth from "../auth";
import e, { Application } from "express";
import {calculateMonitoringPageCriteria, MonitoringParams}  from "./monitoringPage";
import {generateVisits}  from "./monitoringVisit";
import responseUtil from "./responseUtil";
import { query } from "express-validator/check";

export default function (app: Application, baseUrl: string) {
  const apiUrl = `${baseUrl}/monitoring`;

    /**
     * @api {get} /api/v1/monitoring/page Get visits page
     * @apiName MonitoringPage
     * @apiGroup Monitoring
     * @apiDescription Get a page of monitoring visits.   First recording are sorted into visits and then the best-classification for this visit is calculated.
     * Optionally you can also a specify an ai so you can compare the best classification with that given by the ai.   
     * 
     * @apiUse V1UserAuthorizationHeader
     * @apiParam {number} devices  A list of ids of devices to include
     * @apiParam {number} groups  A list of ids of groups to include
     * @apiParam {date} from  Retreive visits after this date
     * @apiParam {date} until Retreive visits starting on or before this date
     * @apiParam {number} page  Page number to retrieve
     * @apiParam {number} page Maximum numbers of visits to show on each page
     * @apiParam {string} ai   Name of AI to compute results to put in classificationAI.   This will not affect the (best) classification, 
     * which always uses a predefined AI choice.
     * @apiParam {string} viewmode   dsaf
     * 
     * @apiSuccess {JSON} params The parameters used to retrieve these results.  Most of these fields are from the request.  
     * However, pageFrom (date), pageUntil (date) and pagesEstimated are calculated by the server. 
     * @apiSuccess {JSON} visits The resulting visits
     * @apiSuccess {boolean} success True
     * @apiSuccess {string} messages Any message from the server
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     *     {
     *       "messages": [
     *           "Completed query."
     *       ],
     *       "params": {
     *           "page": "1",
     *           "pagesEstimate": 1,
     *           "searchFrom": "2017-01-31T11:00:00.000Z",
     *           "searchUntil": "2021-05-17T22:39:46.393Z",
     *           "compareAi": "Master",
     *           "pageFrom": "2017-01-31T11:00:00.000Z",
     *           "pageUntil": "2021-05-17T22:39:46.393Z"
     *       },
     *       "visits": [
     *           {
     *               "device": "cy_only_master_3fb41ee1",
     *               "deviceId": 1,
     *               "recordings": [
     *                   {
     *                       "recId": 1,
     *                       "start": "2021-05-09T10:01:00.000Z",
     *                       "tracks": [
     *                           {
     *                               "tag": null,
     *                               "isAITagged": false,
     *                               "aiTag": null,
     *                               "start": 2,
     *                               "end": 8
     *                           }
     *                       ]
     *                   }
     *               ],
     *               "tracks": 1,
     *               "station": "",
     *               "stationId": 0,
     *               "timeStart": "2021-05-09T10:01:00.000Z",
     *               "timeEnd": "2021-05-09T10:01:12.000Z",
     *               "classification": "none",
     *               "classFromUserTag": false,
     *               "classificationAi": "none",
     *               "incomplete": false
     *           }
     *       ],
     *       "success": true
     *   }
     * @apiSuccess {JSON} visits Calculated visits with classifications.
     * 
     * @apiUse V1ResponseError
     */ 
    app.get(
        apiUrl + "/page",
        [auth.authenticateUser, 
        toIdArray("devices").optional(),
        toIdArray("groups").optional(),
        toDate("from").optional(),
        toDate("until").optional(), 
        query("page").isLength({min: 1, max: 10000}),
        query("page-size").isInt({min: 1, max: 100}),
        middleware.isValidName(query, "ai").optional()], 
        middleware.viewMode(),
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

            const viewAsSuperAdmin = request.body.viewAsSuperAdmin;
            const searchDetails = await calculateMonitoringPageCriteria(params, viewAsSuperAdmin);
            searchDetails.compareAi = request.query["ai"] || "Master";
            
            const visits = await generateVisits(user, searchDetails, viewAsSuperAdmin);
        
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

