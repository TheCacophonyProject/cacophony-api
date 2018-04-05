const models       = require('../../models');
const responseUtil = require('./responseUtil');
const middleware   = require('../middleware');
const { check, oneOf } = require('express-validator/check');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/events';

  /**

   */
  app.post(
    apiUrl,
    [
      middleware.authenticateDevice,
      middleware.getEventDetailById.optional(),
      check("eventDateTimes", "List of times event happened is required.").exists(),
      oneOf([
        check("eventDetailId").exists(),
        check("type").exists(),
      ], "Either 'eventDetailId' or 'type' must be specified"),
    ],
    middleware.requestWrapper(async (request, response) => {

      var detailsId = request.body.eventDetailId
      if (!detailsId) {
        var existingMatchingDetail = await models.EventDetail.getMatching(request.body.type, request.body.details);
        if (existingMatchingDetail) {
          detailsId = existingMatchingDetail.id;
        }
        else {
          var newDetails = await models.EventDetail.create({
            type: request.body.type,
            details: request.body.details,
          });
          detailsId = newDetails.id;
        }
      }

      var eventList = [];
      var count = 0;

      request.body.eventDateTimes.forEach(function(time) {
        eventList.push({
          DeviceId: request.device.id,
          EventDetailId: detailsId,
          eventDateTime: time,
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