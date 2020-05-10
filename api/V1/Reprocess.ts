/*
cacophony-api: The Cacophony Project API server
Copyright (C) 2019  The Cacophony Project

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
import { body, param } from "express-validator/check";

import recordingUtil from "./recordingUtil";
import { Application } from "express";

export default (app: Application, baseUrl: string) => {
  const apiUrl = `${baseUrl}/reprocess`;

  /**
   * @api {get} /api/v1/reprocess/:id
   * @apiName Reprocess
   * @apiGroup Recordings
   * @apiParam {Number} id of recording to reprocess
   * @apiDescription Marks a recording for reprocessing and archives existing tracks
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {Number} recordingId - recording_id reprocessed
   */
  app.get(
    `${apiUrl}/:id`,
    [auth.authenticateUser, param("id").isInt()],
    middleware.requestWrapper(async (request, response) => {
      return await recordingUtil.reprocess(request, response);
    })
  );

  /**
   * @api {post} /api/v1/reprocess Mark recordings for reprocessing
   * @apiName ReprocessMultiple
   * @apiGroup Recordings
   * @apiParam {JSON} recordings an array of recording ids to reprocess
   *
   * @apiDescription Mark one or more recordings for reprocessing,
   * archiving any tracks and recording tags that are associated with
   * them.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiUse V1RecordingReprocessResponse
   */
  app.post(
    apiUrl,
    [auth.authenticateUser, middleware.parseJSON("recordings", body)],
    middleware.requestWrapper(async (request, response) => {
      return await recordingUtil.reprocessAll(request, response);
    })
  );
};
