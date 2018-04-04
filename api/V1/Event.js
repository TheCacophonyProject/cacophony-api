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

      newEvent = await models.Event.create({
        DeviceId: request.device.id,
        EventDetailId: detailsId,
        eventDateTime: request.body.eventDateTime
      });

      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: ['Added event.'],
        eventId: newEvent.id,
        eventDetailId: detailsId,
      });
    })
  );
};