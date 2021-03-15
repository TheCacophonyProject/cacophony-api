import config from "./config";
const winston = require("winston");
import eventUtil, { PowerEvents } from "./api/V1/eventUtil";
import moment, { Moment } from "moment";
import { sendEmail } from "./emailUtil";
import models from "./models";

const ADMIN_EMAILS = ["coredev@cophony.org.nz", "support@2040.co.nz"]
async function main() {
  if (!config.smtpDetails) {
    throw "No SMTP details found in config/app.js";
  }
  const stoppedDevices = (
    await eventUtil.powerEventsPerDevice({ query: {} }, true)
  ).filter((device: PowerEvents) => device.hasStopped == true);
  if (stoppedDevices.length == 0) {
    log.info("No stopped devices in the last 24 hours");
    return;
  }
  const html = generateHtml(stoppedDevices,);
  const text = generateText(stoppedDevices);

  const success = await sendEmail(
    html,
    text,
    "coredev@cacophony.org.nz",
    "Stopped Devices"
  );
  if (success) {
    const detail = await models.DetailSnapshot.getOrCreateMatching(
      "stop-reported",
      {}
    );
    const detailsId = detail.id;
    const eventList = [];
    const time = new Date();

    for (const stoppedDevice of stoppedDevices) {
      eventList.push({
        DeviceId: stoppedDevice.Device.id,
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

function generateText(
  stoppedDevices: PowerEvents[]
): string {
  let textBody = `Stopped Devices ${moment().format("MMM ddd Do ha")}\r\n`;
  for (const event of stoppedDevices) {
    let deviceText = `${event.Device.groupname}- ${event.Device.devicename} ${event.Device.id} has stopped, last powered on ${event.lastStarted.format("MMM ddd Do ha")}\r\n`;
    textBody += deviceText;
  }
  textBody += "Thanks, Cacophony Team";
  return textBody;
}

function generateHtml(
  stoppedDevices: PowerEvents[]
): string {
  let html = `<h1>Stopped Devices ${moment().format("MMM ddd Do ha")} <h1>`;
  html += "<li>";
  for (const event of stoppedDevices) {
    let deviceText = `<ul>${event.Device.groupname}- ${event.Device.devicename} ${event.Device.id} has stopped, last powered on ${event.lastStarted.format("MMM ddd Do ha")}</ul>`;
    html += deviceText;
  }
  html += "</li>";
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
