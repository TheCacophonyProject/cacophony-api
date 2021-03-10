import middleware from "../middleware";
import models from "../../models";
import { Device } from "../../models/Device";
import { Event } from "../../models/Event";

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

async function stoppedDevices(request: any, admin?: boolean) : Promise<PowerEvents[]> {
  const query = request.query;
  let options = {} as QueryOptions;
  options.eventType = ["rpi-power-on","daytime-power-off","stop-reported"];
  options.admin = admin;
  options.useCreatedDate = false;
  const result = await models.Event.latestPowerEvents(
    request.user,
    query.deviceID,
    options
  );
  const startStopByDevice = {};
   for(const event of result.rows){
    if(startStopByDevice.hasOwnProperty(event.DeviceId)){
      startStopByDevice[event.DeviceId].update(event);
    }else{
      startStopByDevice[event.DeviceId] =new PowerEvents(event);
    }
  }
  for (const id of Object.keys(startStopByDevice)) {
    startStopByDevice[id].checkIfStopped();
  }

  return Object.values(startStopByDevice) as PowerEvents[];
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

export class PowerEvents {
  lastReported: Moment | null;
  lastStarted: Moment| null;
  lastStopped: Moment| null;
  Device: Device | null;
  hasStopped: boolean;
  constructor(event: Event)
   {
     this.hasStopped = false;
    this.lastReported = null;
    this.lastStarted = null;
    this.lastStopped = null;
    this.update(event);
  }
  update(event:Event){
    if(!this.Device && event.Device){
      this.Device = event.Device;
    }
    const eventDate = moment(event.dateTime);
    switch(event.EventDetail.type) {
      case "rpi-power-on":
        if(this.lastStarted == null || eventDate.isAfter(this.lastStarted)){
          this.lastStarted =eventDate;
        }
        break;
      case "daytime-power-off":
        if(this.lastStopped == null || eventDate.isAfter(this.lastStopped)){
          this.lastStopped =eventDate;
        }
        break;
      case "stop-reported":
        if(this.lastReported == null || eventDate.isAfter(this.lastReported)){
          this.lastReported =eventDate;
        }
    }
  }
  checkIfStopped(): boolean {
      if(this.lastStarted == null){
        this.hasStopped = false;
        return this.hasStopped;
      }
      let hasStopped = false;

      // check that started hasn't occured after stopped
      if(this.lastStopped ==null || this.lastStarted.isAfter(this.lastStopped)){
        if(this.lastStopped == null){
          // check that the started event was atleast 12 hours ago
          hasStopped = moment().diff(this.lastStarted, "hours") >12;
        }else{
          //check we are atleast 30 minutes after expected stopped time (based of yesterdays)
          hasStopped= moment().diff(this.lastStopped, "minutes") > 24.5 * 60;
        }
      }else{
        // check this isn't yesterdays start stop events
        hasStopped = moment().diff(this.lastStarted, "hours") > 24
      }

      // check we haven't already reported this event
      if(hasStopped){
        this.hasStopped =  this.lastReported == null || this.lastReported.isBefore(this.lastStarted);
      }else{
        this.hasStopped = false;
      }
      return this.hasStopped;

  }
}


export default {
  eventAuth,
  uploadEvent,
  errors,
  stoppedDevices,
};
