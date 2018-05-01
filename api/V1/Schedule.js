const models       = require('../../models');
const responseUtil = require('./responseUtil');
const middleware   = require('../middleware');
const { body }     = require('express-validator/check');

module.exports = (app, baseUrl) => {
  var apiUrl = baseUrl + '/schedules';

  /**
   * @api {post} /api/v1/schedules Adds a new schedule
   * @apiName PostSchedule
   * @apiGroup Schedules
   * @apiDescription This call is used to upload a new audio bait schedule which controls which sound files
   * are played when.
   *
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiBody {JSON} data Metadata about the schedule in JSON format.
   *
   * @apiParam {Int[]} devices List of device Ids that schedule should apply to
   * @apiParam {JSON} schedule Schedule
   *
   * @apiUse V1ResponseSuccess
   * @apiuse V1ResponseError
   */
  app.post(
    apiUrl,
    [
      middleware.authenticateUser,
      body('schedule', '"schedule" is missing').exists(),
      body('devices', '"devices" is missing.  This is a list of device ids that the schedule should be applied to.').exists(),
    ],
    middleware.requestWrapper(async function(request, response) {
      try {
        await request.user.checkUserControlsDevices(request.body.devices);
      }
      catch (error) {
        if (error.name == 'UnauthorizedDeviceException') {
          return responseUtil.send(response, {
            statusCode: 400,
            success: false,
            messages: [error.message]
          });
        } else {
          throw error;
        }
      }

      var instance = models.Schedule.build(request.body, ["schedule"]);
      instance.set('UserId', request.user.id);
      await instance.save();

      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: ['Added new schedule.'],
      });
    })
  );
};

