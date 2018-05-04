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
   * @apiDescription This call is used to upload a new audio bait schedule which controls when
   * sound bait files are played.
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
      var deviceIds = request.body.devices;
      try {
        await request.user.checkUserControlsDevices(deviceIds);
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

      await models.Device.update(
        {ScheduleId: instance.id},
        {where: {id: deviceIds}}
      );

      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: ['Added new schedule.'],
      });
    })
  );

  /**
   * @api {get} api/v1/schedules/ Get device audio bait schedule (for this device)
   * @apiName GetSchedule
   * @apiGroup Schedules
   * @apiDescription This call is used by a device to retrieve its audio bait
   * schedule.
   * @apiUse V1DeviceAuthorizationHeader
   *
   * @apiSuccess {JSON} schedule Metadata of the schedule.
   * @apiUse V1ResponseSuccess
   *
   * @apiUse V1ResponseError
   */
  app.get(
    apiUrl,
    [
      middleware.authenticateDevice,
    ],
    middleware.requestWrapper(async (request, response) => {
      return getSchedule(request.device, response);
    })
  );

  /**
   * @api {get} api/v1/schedules/:devicename Get audio bait schedule (for a user's device)
   * @apiName GetScheduleForDevice
   * @apiGroup Schedules
   * @apiDescription This call is used by a user to retrieve the audio bait
   * schedule for one of their devices.
   * @apiUse V1UserAuthorizationHeader
   *
   * @apiSuccess {JSON} userData Metadata of the scedule.
   * @apiUse V1ResponseSuccess
   *
   * @apiUse V1ResponseError
   */
  app.get(
    apiUrl + "/:devicename",
    [
      middleware.authenticateUser,
      middleware.getDeviceByName,
    ],
    middleware.requestWrapper(async (request, response) => {
      var device = request.body["device"];
      try {
        await request.user.checkUserControlsDevices([device.id]);
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

      return getSchedule(device, response);
    })
  );
};

async function getSchedule(device, response) {
  var schedule = (device.ScheduleId) ? await models.Schedule.findById(device.ScheduleId) : {schedule: {}};

  if (!schedule) {
    return responseUtil.send(response, {
      statusCode: 400,
      success: false,
      devicename: device.devicename,
      messages: ["Cannot find schedule."],
    });
  }

  return responseUtil.send(response, {
    statusCode: 200,
    success: true,
    messages: [],
    deviceid: device.id,
    devicename: device.devicename,
    schedule: schedule.schedule,
  });
}
