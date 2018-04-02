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
    ],
    middleware.requestWrapper(async (request, response) => {

      var mydetails = await models.EventDetail.create({
        type: request.body.type,
        details: request.body.details,
      });

      event = models.Event.create({
       DeviceId: request.device.id,
       EventDetailId: mydetails.id,
      });


      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: ['Added event detail.'],
        eventDetails: mydetails.id
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