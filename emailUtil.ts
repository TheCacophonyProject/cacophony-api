import config from "./config";
import { Recording } from "./models/Recording";
import { TrackTag } from "./models/TrackTag";
import log from "./logging";
import moment, { Moment } from "moment";
import { SMTPClient, Message } from "emailjs";
import { Readable } from "stream";

function alertBody(
  recording: Recording,
  tag: TrackTag,
  camera: String,
  hasThumbnail: boolean
): string[] {
  const dateTime = moment(recording.recordingDateTime)
    .tz(config.timeZone)
    .format("h:mma Do MMM");
  let html = `<b>${camera} has detected a ${tag.what} - ${dateTime}</b>`;
  if (hasThumbnail) {
    html += `<br>  <img width="100" height ="100" src="cid:thumbnail" alt="recording thumbnail"><br>`;
  }
  html += `<br><a  href="${config.server.recording_url_base}/${recording.id}/${tag.TrackId}?device=${recording.DeviceId}">View Recording</a>`;
  html += "<br><p>Thanks,<br> Cacophony Team</p>";

  let text = `${camera} has detected a ${tag.what} - ${dateTime}\r\n`;
  text += `Go to ${config.server.recording_url_base}/${recording.id}/${tag.TrackId}?device=${recording.DeviceId} to view this recording\r\n`;
  text += "Thanks, Cacophony Team";
  return [html, text];
}

async function sendEmail(
  html: string,
  text: string,
  to: string,
  subject: string,
  thumbnail?: Buffer
): Promise<boolean> {
  const client = new SMTPClient(config.smtpDetails);
  log.info(`Sending  email with subject ${subject} to ${to}`);
  try {
    const message = new Message({
      text: text,
      from: config.smtpDetails.from_name,
      to: to,
      subject: subject,
      attachment: [{ data: html, alternative: true }]
    });
    if (thumbnail) {
      message.attach({
        stream: Readable.from(thumbnail),
        type: "image/png",
        headers: { "Content-ID": "<thumbnail>" }
      });
    }
    await client.sendAsync(message);
  } catch (err) {
    log.error(err);
    return false;
  }
  return true;
}

export { sendEmail, alertBody };
