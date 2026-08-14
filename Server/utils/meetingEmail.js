import { sendEmail } from "./mailService.js";

const brand = "#3354F4";

const wrap = (title, bodyHtml) =>
  `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
    <h2 style="color: #1f2937; margin: 0 0 16px;">${title}</h2>
    ${bodyHtml}
    <p style="color: #6b7280; font-size: 12px; margin-top: 24px; border-top: 1px solid #eef2f7; padding-top: 12px;">
      Sent by your Employee Management System. If you didn't request this, you can safely ignore this email.
    </p>
  </div>`;

const joinButton = (url, label = "Join meeting") =>
  `<div style="margin: 20px 0; text-align: center;">
     <a href="${url}" style="background:${brand}; color:#ffffff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600; display:inline-block;">${label}</a>
   </div>`;

const meetingMeta = (meeting, meetingUrl) => `
  <table style="width:100%; border-collapse:collapse; margin:12px 0; font-size:14px; color:#374151;">
    <tr><td style="padding:6px 0; color:#6b7280; width:110px;">Meeting</td><td><strong>${meeting.title || "Meeting"}</strong></td></tr>
    <tr><td style="padding:6px 0; color:#6b7280;">Date</td><td>${new Date(meeting.start).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}</td></tr>
    ${meeting.duration ? `<tr><td style="padding:6px 0; color:#6b7280;">Duration</td><td>${meeting.duration} minutes</td></tr>` : ""}
    ${meeting.organizer?.name ? `<tr><td style="padding:6px 0; color:#6b7280;">Host</td><td>${meeting.organizer.name}</td></tr>` : ""}
    ${meeting.passwordProtected ? `<tr><td style="padding:6px 0; color:#6b7280;">Password</td><td><strong>${meeting.settings?.meetingPassword || "—"}</strong></td></tr>` : ""}
    <tr><td style="padding:6px 0; color:#6b7280;">Meeting ID</td><td><strong>${meeting.meetingId}</strong></td></tr>
  </table>
  ${joinButton(meetingUrl)}`;

export const sendMeetingInvitationEmail = async ({
  to,
  name,
  meeting,
  meetingUrl,
}) => {
  const html = wrap(
    "You're invited to a meeting",
    `<p style="color:#4b5563;">Hi ${name},</p>
     <p style="color:#4b5563;">You have been invited to join the following meeting.</p>
     ${meetingMeta(meeting, meetingUrl)}`
  );
  return sendEmail({
    to,
    subject: `Invitation: ${meeting.title || "Meeting"}`,
    text: `You're invited to "${meeting.title}" on ${new Date(meeting.start).toLocaleString()}. Join here: ${meetingUrl}`,
    html,
  });
};

export const sendGuestInvitationEmail = async ({
  to,
  name,
  meeting,
  joinUrl,
}) => {
  const html = wrap(
    "You've been invited to join a meeting",
    `<p style="color:#4b5563;">Hi ${name || "there"},</p>
     <p style="color:#4b5563;">You've been invited to join a meeting as a guest. Click the button below to verify your identity and join.</p>
     ${meetingMeta(meeting, joinUrl)}
     <p style="color:#9ca3af; font-size:13px;">This invitation link expires on ${new Date(meeting.expiresAt || Date.now() + 7 * 86400000).toLocaleString()}. You'll need to verify with a one-time code sent to your email.</p>`
  );
  return sendEmail({
    to,
    subject: `Join "${meeting.title || "Meeting"}" as a guest`,
    text: `You've been invited to join "${meeting.title}" as a guest. Open ${joinUrl} to join.`,
    html,
  });
};

export const sendGuestOtpEmail = async ({ to, name, otp }) => {
  const html = wrap(
    "Your meeting verification code",
    `<p style="color:#4b5563;">Hi ${name || "there"},</p>
     <p style="color:#4b5563;">Use the code below to verify your identity and join the meeting.</p>
     <div style="background:#eef1ff; color:${brand}; font-size:28px; font-weight:700; text-align:center; padding:16px; border-radius:8px; letter-spacing:8px; margin:16px 0;">${otp}</div>
     <p style="color:#6b7280; font-size:13px;">This code is valid for 10 minutes. Please do not share it with anyone.</p>`
  );
  return sendEmail({
    to,
    subject: "Your meeting verification code",
    text: `Your one-time meeting verification code is: ${otp}. Valid for 10 minutes.`,
    html,
  });
};

export const sendMeetingReminderEmail = async ({ to, name, meeting, meetingUrl, minutesBefore }) => {
  const html = wrap(
    `Reminder: ${meeting.title || "Meeting"}`,
    `<p style="color:#4b5563;">Hi ${name || "there"},</p>
     <p style="color:#4b5563;">This is a reminder that your meeting starts in ${minutesBefore ? `${minutesBefore} minutes` : "soon"}.</p>
     ${meetingMeta(meeting, meetingUrl)}`
  );
  return sendEmail({
    to,
    subject: `Reminder: ${meeting.title || "Meeting"}`,
    text: `Reminder: "${meeting.title}" starts in ${minutesBefore ? `${minutesBefore} minutes` : "soon"}. ${meetingUrl}`,
    html,
  });
};

export const sendMeetingMissedEmail = async ({ to, name, meeting, meetingUrl }) => {
  const html = wrap(
    `You missed a meeting`,
    `<p style="color:#4b5563;">Hi ${name || "there"},</p>
     <p style="color:#4b5563;">You missed "${meeting.title || "Meeting"}". You can review the recording and notes in the app.</p>
     ${meetingMeta(meeting, meetingUrl)}`
  );
  return sendEmail({
    to,
    subject: `You missed: ${meeting.title || "Meeting"}`,
    text: `You missed "${meeting.title}". Review the details here: ${meetingUrl}`,
    html,
  });
};
