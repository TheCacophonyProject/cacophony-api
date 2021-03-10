import config from "./config";
const winston = require("winston");
import eventUtil, {PowerEvents} from "./api/V1/eventUtil";
import moment, { Moment } from "moment";
import { sendEmail } from "./emailUtil";
import models from "./models";

async function main() {
  if (!config.smtpDetails) {
    throw "No SMTP details found in config/app.js";
  }
  const startDate = moment().tz(config.timeZone).subtract(48, "hours");
  const query = {
    startTime: startDate.toDate()
  };
  const stoppedDevices = await eventUtil.stoppedDevices({ query: query }, true);
  if (stoppedDevices.length == 0) {
    log.info("No stopped devices in the last 24 hours");
    return;
  }
  const html = generateHtml(startDate, stoppedDevices);
  const text = generateText(startDate, stoppedDevices);
  //
  // const success = await sendEmail(
  //   html,
  //   text,
  //   "giampaolo@cacophony.org.nz",
  //   "Stopped Devices in the last 24 hours"
  // );
  const success = true;
  if(success){
      const detail = await models.DetailSnapshot.getOrCreateMatching(
        "stop-reported",
        {}
      );
      const detailsId = detail.id;
      const eventList = [];
      const time = new Date();

      for(const stoppedDevice of stoppedDevices){
        eventList.push({
          DeviceId: stoppedDevice.Device.id,
          EventDetailId: detailsId,
          dateTime: time
        })
      }
      try {
        await models.Event.bulkCreate(eventList);
      } catch (exception) {
        log.error("Failed to record stop-reported events.", exception.message)
      }
  }
}

function generateText(
  startDate: Moment,
  stoppedDevices: PowerEvents[]
): string {
  let textBody = `Stopped Devices ${startDate.format(
    "MMM ddd Do ha"
  )}\r\n`;
  for (const event of stoppedDevices) {
    let deviceText = `${event.Device.groupname}- ${event.Device.devicename} ${event.Device.id} has stopped\r\n`;
    textBody += deviceText;
  }
  textBody += "Thanks, Cacophony Team";
  return textBody;
}
function generateHtml(
  startDate: Moment,
  stoppedDevices: PowerEvents[]
): string {
  let html = `<h1>Stopped Devices ${startDate.format(
    "MMM ddd Do ha"
  )} <h1>`;
  html += '<li>'
  for (const event of stoppedDevices) {
    let deviceText = `<ul>${event.Device.groupname}- ${event.Device.devicename} ${event.Device.id} has stopped</ul>`;
    html += deviceText;
  }
  html += '</li>'
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
