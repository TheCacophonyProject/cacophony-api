import nodemailer from "nodemailer";
import config from "./config";
import { Recording } from "./models/Recording";
import { TrackTag } from "./models/TrackTag";
import log from "./logging";
import moment, { Moment } from "moment";

function alertHTML(
  recording: Recording,
  tag: TrackTag,
  camera: String
): string {
  const dateTime = moment(recording.recordingDateTime).format(" H:MMa Do MMM");
  let html = `<h1>${camera} has detected a ${tag.what} - ${dateTime}</h1>`;
  html += `<a  href="${config.server.recording_url_base}/${recording.id}?device=${recording.DeviceId}">View Recording</a>`;
  html += "<br><p>Thanks,<br> Cacophony Team</p>";
  return html;
}

async function sendEmail(
  html: string,
  to: string,
  subject: string
): Promise<boolean> {
  var transporter = nodemailer.createTransport(config.smtpDetails);

  var mailOptions = {
    from: config.smtpDetails.from_name,
    to: to,
    subject: subject,
    html: html
  };

  await transporter
    .sendMail(mailOptions)
    .then((error: any) => {
      if (error && error.rejected.length > 0) {
        log.error(error);
        return false;
      } else {
        return true;
      }
    })
    .catch(function (err) {
      log.error(err);
    });
  return false;
}

export default function () {
  console.log("");
}
export { sendEmail, alertHTML };
