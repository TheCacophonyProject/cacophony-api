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
    ],
    middleware.requestWrapper(async (request, response) => {

      var eventDetails = await models.EventDetails.create({
        type: request.body.type,
        details: {"traptype": "pass"},
      });

      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: ['Added event detail.'],
        eventDetails: eventDetails.id
      });
    })
  );
};