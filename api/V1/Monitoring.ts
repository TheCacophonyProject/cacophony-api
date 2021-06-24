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

import middleware, { toIdArray, toDate, isInteger } from "../middleware";
import auth from "../auth";
import e, { Application } from "express";
import {
  calculateMonitoringPageCriteria,
  MonitoringParams
} from "./monitoringPage";
import { generateVisits } from "./monitoringVisit";
import responseUtil from "./responseUtil";
import { query } from "express-validator/check";

export default function (app: Application, baseUrl: string) {
  const apiUrl = `${baseUrl}/monitoring`;

  /**
     * @api {get} /api/v1/monitoring/page Get visits page
     * @apiName MonitoringPage
     * @apiGroup Monitoring
     * @apiDescription Get a page of monitoring visits.   Visits are returned with the most recent ones listed first.
     *
     * As part of this process recordings are sorted into visits and then the best-classification for each visit is calculated.
     * Optionally you can also a specify an ai so you can compare the best classification with that given by the ai.
     *
     * How many visits are returned is governed by the page-size parameter which is used to calculate page start and page end timestamps.
     * In some circumstances the number of visits returned may be slightly bigger or smaller than the page-size.
     *
     * @apiUse V1UserAuthorizationHeader
     * @apiParam {number|number[]} devices  A single device id, or a JSON list of device ids to include.  eg 52, or [23, 42]
     * @apiParam {number|number[]} groups  A single group id or a JSON list of group ids to include.  eg 20, or [23, 42]
     * @apiParam {timestamp} from  Retrieve visits after this time
     * @apiParam {timestamp} until Retrieve visits starting on or before this time
     * @apiParam {number} page  Page number to retrieve
     * @apiParam {number} page-size Maximum numbers of visits to show on each page.  Note: Number of visits is approximate per page.  In some situations number maybe slightly bigger or smaller than this.
     * @apiParam {string} ai   Name of the AI to be used to compute the 'classificationAI' result.  Note: This will not affect the
     * 'classification' result, which always uses a predefined AI/human choice.
     * @apiParam {string} viewmode   View mode for super user.
     *
     * @apiSuccess {JSON} params The parameters used to retrieve these results.  Most of these fields are from the request.
     * Calculated fields are listed in the 'Params Details' section below.
     * @apiSuccess {JSON} visits The returned visits.   More information in the 'Visits Details' section below.
     * @apiSuccess {boolean} success True
     * @apiSuccess {string} messages Any message from the server
     * @apiSuccess (Params Details) {number} pagesEstimate Estimated number of pages in this query,
     * @apiSuccess (Params Details) {timestamp} pageFrom Visits on this page start after this time,
     * @apiSuccess (Params Details) {timestamp} pageUntil Visits on this page start before or at this time,
     * @apiSuccess (Visit Details){string} device Name of device.
     * @apiSuccess (Visit Details){number} deviceId Id of device.
     * @apiSuccess (Visit Details){JSON} recordings More information on recordings and tracks that make up the visit
     * @apiSuccess (Visit Details){number} tracks Number of tracks that are included in this visit
     * @apiSuccess (Visit Details){string} station Name of station where recordings took place (if defined)
     * @apiSuccess (Visit Details){number} stationId Id of station where recordings took place (if defined else 0)
     * @apiSuccess (Visit Details){timestamp} timeStart Time visit starts
     * @apiSuccess (Visit Details){timestamp} timeEnd Time visit ends
     * @apiSuccess (Visit Details){string} timeEnd Time visit ends
     * @apiSuccess (Visit Details){boolean} timeEnd Time visit ends
     * @apiSuccess (Visit Details){string} classification Cacophony classification.   (This is the best classification we have for this visit)
     * @apiSuccess (Visit Details){string} classificationAi Best classification from AI specified in request params, otherwise best classification from AI Master.
     * @apiSuccess (Visit Details){boolean} classFromUserTag True if the Cacophony classification was made by a user.   False if it was an AI classification
     * @apiSuccess (Visit Details){boolean} incomplete Visits are incomplete if there maybe more recordings that belong to this visit.  This can only
     * occur at the start or end of the time period.   If it occurs at the start of the time period then for counting purposes it doesn't really belong
     * in this time period.

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
    [
      auth.authenticateUser,
      toIdArray("devices").optional(),
      toIdArray("groups").optional(),
      toDate("from").optional(),
      toDate("until").optional(),
      isInteger("page", { min: 1, max: 10000 }),
      isInteger("page-size", { min: 1, max: 100 }),
      middleware.isValidName(query, "ai").optional()
    ],
    middleware.viewMode(),
    middleware.requestWrapper(
      async (request: e.Request, response: e.Response) => {
        const user = (request as any).user;
        const params: MonitoringParams = {
          user,
          devices: request.query.devices as unknown[] as number[],
          groups: request.query.groups as unknown[] as number[],
          page: Number(request.query.page),
          pageSize: Number(request.query["page-size"])
        };

        if (request.query.from) {
          params.from = new Date(request.query.from as string);
        }

        if (request.query.until) {
          params.until = new Date(request.query.until as string);
        }

        const viewAsSuperAdmin = request.body.viewAsSuperAdmin;
        const searchDetails = await calculateMonitoringPageCriteria(
          params,
          viewAsSuperAdmin
        );
        searchDetails.compareAi = (request.query["ai"] as string) || "Master";

        const visits = await generateVisits(
          user,
          searchDetails,
          viewAsSuperAdmin
        );

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
