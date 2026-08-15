import { sendEmail, escapeHtml } from "./mailService.js";

const brand = "#3354F4";

const wrap = (title, bodyHtml) =>
  `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
    <h2 style="color: #1f2937; margin: 0 0 16px;">${title}</h2>
    ${bodyHtml}
    <p style="color: #6b7280; font-size: 12px; margin-top: 24px; border-top: 1px solid #eef2f7; padding-top: 12px;">
      Sent by your Employee Management System. If you didn't request this, you can safely ignore this email.
    </p>
  </div>`;

const joinButton = (url, label = "Join Microsoft Teams Meeting") =>
  `<div style="margin: 20px 0; text-align: center;">
     <a href="${url}" style="background:${brand}; color:#ffffff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600; display:inline-block;">${label}</a>
   </div>`;

const formatWhen = (event) => {
  const start = event?.start ? new Date(event.start) : null;
  const end = event?.end ? new Date(event.end) : null;
  if (!start) return "";
  if (end && end.getTime() > start.getTime()) {
    const sameDay = start.toDateString() === end.toDateString();
    const range = sameDay
      ? `${start.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })} – ${end.toLocaleTimeString(undefined, { timeStyle: "short" })}`
      : `${start.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })} – ${end.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}`;
    return range;
  }
  return start.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });
};

const eventMeta = ({ event, organizerName, meetingUrl }) => {
  const rows = [
    { label: "Title", value: event?.title ? escapeHtml(event.title) : "" },
    { label: "Organizer", value: organizerName ? escapeHtml(organizerName) : "" },
    { label: "When", value: formatWhen(event) },
  ];
  if (event?.timezone) rows.push({ label: "Time zone", value: escapeHtml(event.timezone) });
  if (event?.location) rows.push({ label: "Location", value: escapeHtml(event.location) });
  if (event?.description) rows.push({ label: "Description", value: escapeHtml(event.description) });
  if (Array.isArray(event?.attendees) && event.attendees.length) {
    rows.push({
      label: "Attendees",
      value: event.attendees
        .map((a) => escapeHtml(a?.name ? `${a.name} <${a.email}>` : a.email))
        .join(", "),
    });
  }
  if (meetingUrl) {
    rows.push({
      label: "Meeting type",
      value: `Microsoft Teams meeting${event?.meetingId ? ` (ID: ${escapeHtml(event.meetingId)})` : ""}`,
    });
    rows.push({ label: "Join link", value: `<a href="${meetingUrl}" style="color:${brand};">${meetingUrl}</a>` });
  }
  const table = `
    <table style="width:100%; border-collapse:collapse; margin:12px 0; font-size:14px; color:#374151;">
      ${rows
        .filter((r) => r?.value)
        .map(
          (r) => `<tr>
            <td style="padding:6px 0; color:#6b7280; width:130px; vertical-align:top;">${r.label}</td>
            <td><strong>${r.value}</strong></td>
          </tr>`
        )
        .join("")}
    </table>`;
  const cta = meetingUrl ? joinButton(meetingUrl) : "";
  return { table, cta };
};

export const sendCalendarInviteEmail = async ({ to, name, event, organizerName, meetingUrl }) => {
  const { table, cta } = eventMeta({ event, organizerName, meetingUrl });
  const html = wrap(
    "You're invited to a calendar event",
    `<p style="color:#4b5563;">Hi ${escapeHtml(name || "there")},</p>
     <p style="color:#4b5563;">You have been invited to the following event${meetingUrl ? ", with a Microsoft Teams meeting to join." : "."}</p>
     ${table}${cta}`
  );
  return sendEmail({
    to,
    subject: `Calendar invite: ${event?.title || "Event"}`,
    text: `You're invited to "${event?.title || "Event"}" on ${formatWhen(event)}${meetingUrl ? `. Join: ${meetingUrl}` : ""}`,
    html,
  });
};

export const sendCalendarUpdatedEmail = async ({ to, name, event, organizerName, meetingUrl }) => {
  const { table, cta } = eventMeta({ event, organizerName, meetingUrl });
  const html = wrap(
    "Calendar event updated",
    `<p style="color:#4b5563;">Hi ${escapeHtml(name || "there")},</p>
     <p style="color:#4b5563;">The following calendar event was updated.</p>
     ${table}${cta}`
  );
  return sendEmail({
    to,
    subject: `Updated: ${event?.title || "Event"}`,
    text: `The calendar event "${event?.title || "Event"}" was updated.`,
    html,
  });
};

export const sendCalendarCancelledEmail = async ({ to, name, event, organizerName }) => {
  const html = wrap(
    "Calendar event cancelled",
    `<p style="color:#4b5563;">Hi ${escapeHtml(name || "there")},</p>
     <p style="color:#4b5563;"><strong>${escapeHtml(event?.title || "Event")}</strong> scheduled for ${formatWhen(event)} has been cancelled by ${escapeHtml(organizerName || "the organizer")}.</p>
     <p style="color:#6b7280; font-size:13px;">No action is needed. If this event had a Microsoft Teams meeting, it has been cancelled as well.</p>`
  );
  return sendEmail({
    to,
    subject: `Cancelled: ${event?.title || "Event"}`,
    text: `The calendar event "${event?.title || "Event"}" on ${formatWhen(event)} has been cancelled.`,
    html,
  });
};
