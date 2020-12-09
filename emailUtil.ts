import config from "./config";
import { Recording } from "./models/Recording";
import { TrackTag } from "./models/TrackTag";
import log from "./logging";
import moment, { Moment } from "moment";
import nodemailer from "nodemailer";
import {Mail} from 'nodemailer/lib/mailer';
import {SMTPConnection} from '@types/nodemailer/lib/smtp-transport';

function alertBody(
  recording: Recording,
  tag: TrackTag,
  camera: String
): string[] {
  const dateTime = moment(recording.recordingDateTime).format(" H:MMa Do MMM");
  let html = `<h1>${camera} has detected a ${tag.what} - ${dateTime}</h1>`;
  html += `<a  href="${config.server.recording_url_base}/${recording.id}?device=${recording.DeviceId}">View Recording</a>`;
  html += "<br><p>Thanks,<br> Cacophony Team</p>";

  let text = `${camera} has detected a ${tag.what} - ${dateTime}\n`;
  text += `Go to ${config.server.recording_url_base}/${recording.id}?device=${recording.DeviceId} to view this recording\n`;
  text += "Thanks, Cacophony Team";
  return [html, text];
}

async function sendEmail(
  html: string,
  text: string,
  to: string,
  subject: string
): Promise<boolean> {
  const transporter: Mail = nodemailer.createTransport(config.smtpDetails);

  var mailOptions: Mail.Options = {
    from: config.smtpDetails.from_name,
    to: to,
    subject: subject,
    html: html,
    text: text
  };

  const info: SMTPConnection.SentMessageInfo = await transporter
    .sendMail(mailOptions)
    .catch(function (err) {
      log.error(err);
      return false;
    });
  if (info.rejected.length > 0) {
    return false;
  }

  return true;
}

export { sendEmail, alertBody };
