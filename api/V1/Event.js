const models       = require('../../models');
const responseUtil = require('./responseUtil');
const middleware   = require('../middleware');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/events';

  /**

   */
  app.post(
    apiUrl,
    [
      middleware.authenticateDevice,
      middleware.getEventDetailById.optional(),
    ],
    middleware.requestWrapper(async (request, response) => {

      var detailsId = request.body.eventDetailId
      if (detailsId == null) {
        var newDetails = await models.EventDetail.create({
          type: request.body.type,
          details: request.body.details,
        });
        detailsId = newDetails.id;
      }

      newEvent = await models.Event.create({
        DeviceId: request.device.id,
        EventDetailId: detailsId,
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

  // app.get(
  //   apiUrl,
  //   [
  //   ],
  //   middleware.requestWrapper(async (request, response) => {
  //     var devices = await models.EventDetails.allForUser(request.user);
  //     return responseUtil.send(response, {
  //       devices: devices,
  //       statusCode: 200,
  //       success: true,
  //       messages: ["completed get devices query"],
  //     });
  //   })
  // );
};