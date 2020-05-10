import middleware from "../middleware";
import models from "../../models";
import responseUtil from "./responseUtil";
import { body, oneOf } from "express-validator/check";

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

  request.body.dateTimes.forEach(function(time) {
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

export default {
  eventAuth,
  uploadEvent
};
