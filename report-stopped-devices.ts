import config from "./config";
const winston = require("winston");
import eventUtil, { PowerEvents } from "./api/V1/eventUtil";
import moment, { Moment } from "moment";
import { sendEmail } from "./emailUtil";
import models from "./models";

const ADMIN_EMAILS = ["support@2040.co.nz"];

async function getUserEvents(powerEvents: PowerEvents[]) {
  const groupAdmins = {};
  const userEvents = {};

  for (const event of powerEvents) {
    if (!groupAdmins.hasOwnProperty(event.Device.GroupId)) {
      const adminUsers = await event.Device.Group.getUsers({
        through: { where: { admin: true } }
      });
      groupAdmins[event.Device.GroupId] = adminUsers;
    }
    for (const user of groupAdmins[event.Device.GroupId]) {
      if (userEvents.hasOwnProperty(user.id)) {
        userEvents[user.id].powerEvents.push(event);
      } else {
        userEvents[user.id] = { user: user, powerEvents: [event] };
      }
    }
  }
  return userEvents;
}

async function main() {
  if (!config.smtpDetails) {
    throw "No SMTP details found in config/app.js";
  }
  const powerEvents = (
    await eventUtil.powerEventsPerDevice({ query: {} }, true)
  ).filter(
    (device: PowerEvents) =>
      device.hasStopped == true && device.hasAlerted == false
  );
  if (powerEvents.length == 0) {
    log.info("No new stopped devices");
    return;
  }

  const userEvents = await getUserEvents(powerEvents);

  let success = false;
  for (const userID in userEvents) {
    const userInfo = userEvents[userID];
    const html = generateHtml(userInfo.powerEvents);
    const text = generateText(userInfo.powerEvents);
    success =
      success ||
      (await sendEmail(html, text, userInfo.user.email, "Stopped Devices"));
  }

  for (const email of ADMIN_EMAILS) {
    const html = generateHtml(powerEvents);
    const text = generateText(powerEvents);
    success =
      success || (await sendEmail(html, text, email, "Stopped Devices"));
  }
  if (success) {
    const detail = await models.DetailSnapshot.getOrCreateMatching(
      "stop-reported",
      {}
    );
    const detailsId = detail.id;
    const eventList = [];
    const time = new Date();

    for (const powerEvent of powerEvents) {
      eventList.push({
        DeviceId: powerEvent.Device.id,
        EventDetailId: detailsId,
        dateTime: time
      });
    }
    try {
      await models.Event.bulkCreate(eventList);
    } catch (exception) {
      log.error("Failed to record stop-reported events.", exception.message);
    }
  }
}

function generateText(stoppedDevices: PowerEvents[]): string {
  let textBody = `Stopped Devices ${moment().format("MMM ddd Do ha")}\r\n`;
  for (const event of stoppedDevices) {
    let deviceText = `${event.Device.Group.groupname}- ${
      event.Device.devicename
    } id: ${
      event.Device.id
    } has stopped, last powered on ${event.lastStarted.format(
      "MMM ddd Do ha"
    )}\r\n`;
    textBody += deviceText;
  }
  textBody += "Thanks, Cacophony Team";
  return textBody;
}

function generateHtml(stoppedDevices: PowerEvents[]): string {
  let html = `<b>Stopped Devices ${moment().format("MMM ddd Do ha")} </b>`;
  html += "<ul>";
  for (const event of stoppedDevices) {
    let deviceText = `<li>${event.Device.Group.groupname}-${
      event.Device.devicename
    } id: ${
      event.Device.id
    } has stopped, last powered on ${event.lastStarted.format(
      "MMM ddd Do ha"
    )}</li>`;
    html += deviceText;
  }
  html += "</ul>";
  html += "<br><p>Thanks,<br> Cacophony Team</p>";
  return html;
}

const log = new winston.Logger({
  transports: [
    new winston.transports.Console({
      timestamp: function () {
        return moment().format();
      },
      colorize: true
    })
  ]
});

main()
  .catch(log.error)
  .then(() => {
    process.exit(0);
  });
