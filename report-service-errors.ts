import config from "./config";
const winston = require("winston");
import eventUtil from "./api/V1/eventUtil";
import moment, { Moment } from "moment";
import { ServiceErrorMap } from "./api/V1/systemError";
import nodemailer from "nodemailer";
import { sendEmail } from "./emailUtil";

async function main() {
  if (!config.smtpDetails) {
    throw "No SMTP details found in config/app.js";
  }
  const endDate = moment().tz(config.timeZone);
  const startDate = moment().tz(config.timeZone).subtract(24, "hours");
  const query = {
    endTime: endDate.toDate(),
    startTime: startDate.toDate(),
    offset: null,
    limit: null
  };
  const serviceErrors = await eventUtil.errors({ query: query }, true);
  if (Object.keys(serviceErrors).length == 0) {
    log.info("No service errors in the last 24 hours");
    return;
  }
  const html = generateHtml(startDate, endDate, serviceErrors);
  const text = generateText(startDate, endDate, serviceErrors);

  await sendEmail(
    html,
    text,
    "coredev@cacophony.org.nz",
    "Service Errors in the last 24 hours"
  );
}

function generateText(
  startDate: Moment,
  endDate: Moment,
  serviceErrors: ServiceErrorMap
): string {
  let html = `Service Errors ${startDate.format(
    "MMM ddd Do ha"
  )} - ${endDate.format("MMM ddd Do ha")}\n`;
  for (const [key, serviceError] of Object.entries(serviceErrors)) {
    let serviceHtml = `${key}\n`;
    let devices = serviceError.devices.join(", ");
    serviceHtml += `Devices: ${devices}\n`;
    serviceHtml += "\n";
    for (const error of serviceError.errors) {
      devices = error.devices.join(", ");
      serviceHtml += "\n";
      serviceHtml += "\n";
      const firstError = moment(error.timestamps[0]);
      const lastError = moment(error.timestamps[error.timestamps.length - 1]);
      const suffix = error.similar.length > 1 ? "s" : "";
      serviceHtml += `${
        error.similar.length
      } Error${suffix} from ${firstError.format(
        "MMM ddd Do H:MMa"
      )} - ${lastError.format("MMM ddd Do H:MMa")}\n`;
      serviceHtml += ` ${error.similar[0].lines}\n`;
      serviceHtml += `Devices Affected:\n`;
      serviceHtml += `${devices}\n`;
      serviceHtml += `\n`;
      serviceHtml += "\n";
    }
    serviceHtml += "\n";
    html += serviceHtml;
  }

  html += "Thanks, Cacophony Team";
  return html;
}
function generateHtml(
  startDate: Moment,
  endDate: Moment,
  serviceErrors: ServiceErrorMap
): string {
  let html = `<h1>Service Errors ${startDate.format(
    "MMM ddd Do ha"
  )} - ${endDate.format("MMM ddd Do ha")}<h1>`;
  for (const [key, serviceError] of Object.entries(serviceErrors)) {
    let serviceHtml = `<h2>${key}</h2>`;
    let devices = serviceError.devices.join(", ");
    serviceHtml += `<h3>Devices: ${devices}</h3>`;
    serviceHtml += "<ul>\n";
    for (const error of serviceError.errors) {
      devices = error.devices.join(", ");
      serviceHtml += "<li>\n";
      serviceHtml += "<p>\n";
      const firstError = moment(error.timestamps[0]);
      const lastError = moment(error.timestamps[error.timestamps.length - 1]);
      const suffix = error.similar.length > 1 ? "s" : "";
      serviceHtml += `${
        error.similar.length
      } Error${suffix} from ${firstError.format(
        "MMM ddd Do H:MMa"
      )} - ${lastError.format("MMM ddd Do H:MMa")}<br>`;
      serviceHtml += ` ${error.similar[0].lines}<br>`;
      serviceHtml += `Devices Affected:<br>`;
      serviceHtml += `${devices}<br>`;
      serviceHtml += `</p>\n`;
      serviceHtml += "</li>\n";
    }
    serviceHtml += "</ul>\n";
    html += serviceHtml;
  }

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
