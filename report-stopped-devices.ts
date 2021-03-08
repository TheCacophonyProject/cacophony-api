import config from "./config";
const winston = require("winston");
import eventUtil from "./api/V1/eventUtil";
import moment, { Moment } from "moment";
import { ServiceErrorMap } from "./api/V1/systemError";
import { sendEmail } from "./emailUtil";

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

  await sendEmail(
    html,
    text,
    "coredev@cacophony.org.nz",
    "Stopped Devices in the last 24 hours"
  );
}

function generateText(
  startDate: Moment,
  stoppedDevices: DeviceStartStop[]
): string {
  let textBody = `Stopped Devices ${startDate.format(
    "MMM ddd Do ha"
  )}\r\n`;
  for (const event of stoppedDevice) {
    let deviceText = `${event.Device.groupname}- ${event.Device.devicename} ${event.Device.id} has stopped\r\n`;
    textBody += deviceText;
  }
  textBody += "Thanks, Cacophony Team";
  return textBody;
}
function generateHtml(
  startDate: Moment,
  stoppedDevices: DeviceStartStop
): string {
  let html = `<h1>Stopped Devices ${startDate.format(
    "MMM ddd Do ha"
  )} - ${endDate.format("MMM ddd Do ha")}<h1>`;
  html += '<li>'
  for (const event of stoppedDevice) {
    let deviceText = `<ul>${event.Device.groupname}- ${event.Device.devicename} ${event.Device.id} has stopped</ul>`;
    textBody += deviceText;
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
