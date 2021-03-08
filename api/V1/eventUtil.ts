import middleware from "../middleware";
import models from "../../models";
import { QueryOptions } from "../../models/Event";

import responseUtil from "./responseUtil";
import { body, oneOf } from "express-validator/check";
import { groupSystemErrors } from "./systemError";
import moment, { Moment } from "moment";

async function errors(request: any, admin?: boolean) {
  const query = request.query;
  let options = {} as QueryOptions;
  options.eventType = "systemError";
  options.admin = admin;
  options.useCreatedDate = true;

  const result = await models.Event.query(
    request.user,
    query.startTime,
    query.endTime,
    query.deviceId,
    query.offset,
    query.limit,
    false,
    options
  );

  return groupSystemErrors(result.rows);
}

async function uploadEvent(request, response) {
  let detailsId = request.body.eventDetailId;
  if (!detailsId) {
    const description = request.body.description;
    const detail = await models.DetailSnapshot.getOrCreateMatching(
      description.type,
      description.details
    );
    detailsId = detail.id;
  }

  const eventList = [];
  let count = 0;

  request.body.dateTimes.forEach(function (time) {
    eventList.push({
      DeviceId: request.device.id,
      EventDetailId: detailsId,
      dateTime: time
    });
    count++;
  });

  try {
    await models.Event.bulkCreate(eventList);
  } catch (exception) {
    return responseUtil.send(response, {
      statusCode: 500,
      messages: ["Failed to record events.", exception.message]
    });
  }

  return responseUtil.send(response, {
    statusCode: 200,
    messages: ["Added events."],
    eventsAdded: count,
    eventDetailId: detailsId
  });
}

async function stoppedDevices(request: any, admin?: boolean) {
  const query = request.query;
  let options = {} as QueryOptions;
  options.eventType = ["rpi-power-on","daytime-power-off","stop-reported"];
  options.admin = admin;
  options.useCreatedDate = false;

  const result = await models.Event.query(
    request.user,
    query.startTime,
    query.endTime,
    query.deviceId,
    query.offset,
    query.limit,
    false,
    options
  );

  const startStopByDevice = {};
  for(const event of result){
    if(startStopByDevice.hasOwnProperty(event.DeviceId)){
      startStopByDevice[event.DeviceId].update(event);
    }else{
      startStopByDevice[event.DeviceId] =new DeviceStartStop(event);
    }
  }
  const stoppedDevices = Object.values(startStopsByDevice).filter(device => device.unreportedStop());
  return stoppedDevices;
}


const eventAuth = [
  middleware.getDetailSnapshotById(body, "eventDetailId").optional(),
  middleware.isDateArray(
    "dateTimes",
    "List of times event occured is required."
  ),
  oneOf(
    [body("eventDetailId").exists(), body("description.type").exists()],
    "Either 'eventDetailId' or 'description.type' must be specified."
  )
];

class DeviceStartStop {
  stopReported: Moment | null;
  started: Moment| null;
  stopped: Moment| null;
  device: Device | null;
  constructor(event: Event)
   {
    this.stopReported = null;
    this.started = null;
    this.stopped = null;
    this.update(event);
  }
  update(event:Event){
    if(!this.device){
      this.deivce = event.Device;
    }
    switch(event.type) {
      case "rpi-power-on":
        if(this.started == null || moment(event.dateTime).isAfter(this.started)){
          this.started = moment(event.dateTime);
        }
        break;
      case "daytime-power-off":
        if(this.stopped == null || moment(event.dateTime).isAfter(this.stopped)){
          this.stopped = moment(event.dateTime);
        }
        break;
      case "stop-reported":
        if(this.stopReported == null || moment(event.stopReported).isAfter(this.stopReported)){
          this.stopReported = moment(event.stopReported);
        }
    }
  }
  unreportedStop(): boolean {
      if(this.started == null){
        return false;
      }
      let hasStopped = false;

      // check that started hasn't occured after stopped
      if(this.stopped ==null || this.started.isAfter(this.stopped)){
        if(this.stopped == null){
        hasStopped = true;
        }else{
            //check we are atleast 30 minutes after expected stopped time (based of yesterdays)
            hasStopped= now().diff(this.stopped, "minutes") > 24.5 * 60;
        }
      }else{
        // check this isn't yesterdays start stop events
        hasStopped = moment().diff(this.started, "hours") > 24
      }

      // check we haven't already reported this event
      if(hasStopped){
        return this.stopReported == null || this.stopReported.isBefore(this.started);
      }
      return false;
  }
}


export default {
  eventAuth,
  uploadEvent,
  errors,
  stoppedDevices
};
