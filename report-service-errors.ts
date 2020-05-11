import config from "./config";
const winston = require("winston");
import eventUtil from "./api/V1/eventUtil";
// import models from "./models";
import moment, { Moment } from "moment";
import { ServiceErrorMap } from "./api/V1/systemError";
import nodemailer from "nodemailer";

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
  console.log(html);
  await sendEmail(html);
}

function generateHtml(
  startDate: Moment,
  endDate: Moment,
  serviceErrors: ServiceErrorMap
): string {
  let html = `<h1>Service Errors ${startDate.format(
    "ddd Do Ha"
  )} - ${endDate.format("ddd Do Ha")}<h1>`;
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
        "ddd do H:MMa"
      )} - ${lastError.format("ddd do H:MMa")}<br>`;
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

async function sendEmail(html: string) {
  var transporter = nodemailer.createTransport(config.smtpDetails);

  var mailOptions = {
    from: "info@cacophony.org.nz",
    to: "	coredev@cacophony.org.nz",
    subject: "Service Errors in the last 24 hours",
    html: html
  };

  log.info("sending email");
  await transporter.sendMail(mailOptions).then((error: any) => {
    if (error && error.rejected.length > 0) {
      log.error(error);
    } else {
      log.info("Email sent");
    }
  });
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
