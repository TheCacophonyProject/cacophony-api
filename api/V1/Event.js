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
   * @apiSuccess {Integer} eventsAdded Numbeer of events added
   * @apiSuccess {Integer} eventDetailId Id of the Event Detail record used.  May be existing or newly created
   * @apiuse V1ResponseError
   */
  app.post(
    apiUrl,
    [
      middleware.authenticateDevice,
      middleware.getEventDetailById.optional(),
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

        var existingMatchingDetail = await models.EventDetail.getMatching(description.type, description.details);
        if (existingMatchingDetail) {
          detailsId = existingMatchingDetail.id;
        }
        else {
          var newDetails = await models.EventDetail.create({
            type: description.type,
            details: description.details,
          });
          detailsId = newDetails.id;
        }
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
          success: false,
          messages: ["Failed to record events.", exception.message],
        });
      }

      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: ['Added events.'],
        eventsAdded: count,
        eventDetailId: detailsId,
      });
    })
  );

  /**
   * @api {get} /api/v1/events Query events recorded
   * @apiName QueryEvents
   * @apiGroup Events
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiUse QueryParams
   *
   * @apiUse V1ResponseError
   */

  app.get(
    apiUrl,
    [
      middleware.authenticateUser,
      middleware.parseJSON('where'),
      query('offset').isInt().optional(),
      query('limit').isInt().optional(),
      middleware.parseJSON('order').optional(),
    ],
    middleware.requestWrapper(async (request, response) => {

      if (request.query.offset == null) {
        request.query.offset = '0';
      }

      if (request.query.offset == null) {
        request.query.limit = '100';
      }

      var result = await models.Event.query(
        request.user,
        request.query.where,
        request.query.offset,
        request.query.limit,
        request.query.order);

      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: ["Completed query."],
        limit: request.query.limit,
        offset: request.query.offset,
        count: result.count,
        rows: result.rows,
      });
    })
  );
};