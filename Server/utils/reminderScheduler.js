import CalendarEvent from "../model/CalendarEvent.model.js";
import { Employee } from "../model/Employee.model.js";
import { notify } from "./notificationService.js";
import { sendEmail } from "./mailService.js";

const CHECK_INTERVAL_MS = 30 * 1000;

let timer = null;

const sendMail = async (recipient, event) => {
  if (!recipient?.email) return;
  const startLabel = new Date(event.start).toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });
  const link = event.meetingLink ? `\n\nJoin here: ${event.meetingLink}` : "";
  await sendEmail({
    to: recipient.email,
    subject: `Reminder: ${event.title}`,
    text: `Hi ${recipient.name},\n\nThis is a reminder for "${event.title}".\nStarts: ${startLabel}${link}\n\nBest regards,\nEmployee Management System`,
  });
};

const processDueReminders = async (io) => {
  const now = Date.now();
  try {
    const events = await CalendarEvent.find({
      "reminders.at": { $lte: new Date(now) },
      "reminders.sentAt": null,
      status: { $nin: ["Completed", "Cancelled"] },
      end: { $gte: new Date(now - 24 * 60 * 60 * 1000) },
    })
      .populate("organizer", "name email")
      .populate("participants", "name email")
      .select("title start end meetingLink meetingPlatform reminders status type organizer participants company");

    for (const event of events) {
      const due = (event.reminders || []).filter((r) => !r.sentAt && r.at <= new Date(now));
      if (!due.length) continue;

      const targets = new Map();
      if (event.organizer?._id) targets.set(String(event.organizer._id), event.organizer);
      (event.participants || []).forEach((p) => {
        if (p?._id) targets.set(String(p._id), p);
      });

      for (const reminder of due) {
        reminder.sentAt = new Date();
        const minutesLabel = reminder.minutesBefore > 0 ? `${reminder.minutesBefore} minutes` : "Scheduled";
        for (const [id, person] of targets) {
          await notify({
            io,
            recipient: id,
            companyId: event.company,
            title: `Reminder: ${event.title}`,
            message: `"${event.title}" starts in ${minutesLabel} · ${new Date(event.start).toLocaleString()}`,
            type: event.type === "interview" ? "interview" : "info",
            link: `/calendar?event=${event._id}`,
          });
          await sendMail(person, event);
        }
      }
      await event.save().catch((err) => console.error("Failed to save reminder state:", err.message));
    }
  } catch (error) {
    console.error("Reminder scheduler error:", error.message);
  }
};

export const startReminderScheduler = (io) => {
  if (timer) return;
  processDueReminders(io);
  timer = setInterval(() => processDueReminders(io), CHECK_INTERVAL_MS);
  timer.unref?.();
};

export const stopReminderScheduler = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};
