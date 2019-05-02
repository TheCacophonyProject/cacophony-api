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

const models       = require('../../models');
const responseUtil = require('./responseUtil');
const middleware   = require('../middleware');
const auth         = require('../auth');
const { body, query, oneOf } = require('express-validator/check');


module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/events';

  /**
   * @api {post} /api/v1/events Add new events
   * @apiName Add Event
   * @apiGroup Events
   * @apiDescription This call is used to upload new events.   Events
   * details are decided by user and can be specified by JSON or using an
   * existing id.
   *
   * `Either eventDetailId or description is required`
   * - eventDetailsId: id
   * - description:
   *   - type:
   *   - details: {JSON}
   * - datetimes: REQUIRED: array of event times in ISO standard format, eg ["2017-11-13T00:47:51.160Z"]
   *
   * @apiUse V1DeviceAuthorizationHeader
   *
   * @apiParam {JSON} data Metadata about the recording (see above).
   *
   * @apiUse V1ResponseSuccess
   * @apiSuccess {Integer} eventsAdded Number of events added
   * @apiSuccess {Integer} eventDetailId Id of the Event Detail record used.  May be existing or newly created
   * @apiuse V1ResponseError
   */
  app.post(
    apiUrl,
    [
      auth.authenticateDevice,
      middleware.getDetailSnapshotById(body, 'eventDetailId').optional(),
      middleware.isDateArray("dateTimes", "List of times event occured is required."),
      oneOf([
        body("eventDetailId").exists(),
        body("description.type").exists(),
      ], "Either 'eventDetailId' or 'description.type' must be specified."),
    ],
    middleware.requestWrapper(async (request, response) => {

      var detailsId = request.body.eventDetailId;
      if (!detailsId) {
        var description = request.body.description;
        var detail = await models.DetailSnapshot.getOrCreateMatching(description.type, description.details);
        detailsId = detail.id;
      }

      var eventList = [];
      var count = 0;

      request.body.dateTimes.forEach(function(time) {
        eventList.push({
          DeviceId: request.device.id,
          EventDetailId: detailsId,
          dateTime: time,
        });
        count++;
      });

      try {
        await models.Event.bulkCreate(eventList);
      } catch (exception) {
        return responseUtil.send(response, {
          statusCode: 500,
          messages: ["Failed to record events.", exception.message],
        });
      }

      return responseUtil.send(response, {
        statusCode: 200,
        messages: ['Added events.'],
        eventsAdded: count,
        eventDetailId: detailsId,
      });
    })
  );

  /**
   * @api {get} /api/v1/events Query recorded events
   * @apiName QueryEvents
   * @apiGroup Events
   *
   * @apiUse V1UserAuthorizationHeader
   * @apiParam {Datetime} [startTime] Return only events after this time
   * @apiParam {Datetime} [endTime] Return only events from before this time
   * @apiParam {Integer} [deviceId] Return only events for this device id
   * @apiParam {Integer} [limit] Limit returned events to this number (default is 100)
   * @apiParam {Integer} [offset] Offset returned events by this amount (default is 0)
   *
   * @apiSuccess {JSON} rows Array containing details of events matching the criteria given.
   * @apiUse V1ResponseError
   */
  app.get(
    apiUrl,
    [
      auth.authenticateUser,
      query('startTime').isISO8601({ strict: true }).optional(),
      query('endTime').isISO8601({ strict: true }).optional(),
      query('deviceId').isInt().optional().toInt(),
      query('offset').isInt().optional().toInt(),
      query('limit').isInt().optional().toInt(),
    ],
    middleware.requestWrapper(async (request, response) => {
      const query = request.query;
      query.offset = query.offset || 0;
      query.limit = query.limit || 100;

      var result = await models.Event.query(
        request.user,
        query.startTime,
        query.endTime,
        query.deviceId,
        query.offset,
        query.limit);

      return responseUtil.send(response, {
        statusCode: 200,
        messages: ["Completed query."],
        limit: query.limit,
        offset: query.offset,
        count: result.count,
        rows: result.rows,
      });
    })
  );
};
