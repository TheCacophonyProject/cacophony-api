const models       = require('../../models');
const responseUtil = require('./responseUtil');
const middleware   = require('../middleware');

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
      middleware.parseArray('devices'),
      middleware.parseJSON('schedule'),
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
      // TODO make the device and scedule changes apply in a single transaction
      await instance.save();

      await models.Device.update(
        {ScheduleId: instance.id},
        {where: {id: deviceIds}}
      );

      return responseUtil.send(response, {
        statusCode: 200,
        success: true,
        messages: ['Added new schedule for the calling device(s).'],
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
        // TODO this should probably be in the normal requestWrapper
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

      return getSchedule(device, response, request.user);
    })
  );
};

async function getSchedule(device, response, user = null) {
  var schedule = {schedule: {}};

  if (device.ScheduleId) {
    schedule = await models.Schedule.findById(device.ScheduleId);
    if (!schedule) {
      return responseUtil.send(response, {
        statusCode: 400,
        success: false,
        devicename: device.devicename,
        messages: ["Cannot find schedule."],
      });
    }
  }

  // get all the users devices that are also associated with this same schedule
  var devices = [];
  if (user && device.ScheduleId) {
    devices = await models.Device.onlyUsersDevicesMatching(user, { ScheduleId : device.ScheduleId });
  }
  else {
    devices = {
      count: 1,
      rows: [device]
    };
  }

  return responseUtil.send(response, {
    statusCode: 200,
    success: true,
    messages: [],
    devices: devices,
    schedule: schedule.schedule,
  });
}
