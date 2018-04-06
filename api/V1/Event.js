const models       = require('../../models');
const responseUtil = require('./responseUtil');
const middleware   = require('../middleware');
const { check, oneOf } = require('express-validator/check');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/events';

  /**
   * @api {post} /api/v1/events Add new events
   * @apiName PostEvent
   * @apiGroup Events
   * @apiDescription This call is used to upload new events.   Events
   * details are decided by user and can be specified by json or using an
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
        check("eventDetailId").exists(),
        check("description.type").exists(),
      ], "Either 'eventDetailId' or 'description.type' must be specified"),
    ],
    middleware.requestWrapper(async (request, response) => {

      var detailsId = request.body.eventDetailId
      if (!detailsId) {
        var description = request.body.description

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
};