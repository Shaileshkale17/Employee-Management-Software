import { isValidObjectId, isDate, isValidEmail, sanitizeString } from "./validation.js";

export const EVENT_TYPES = [
  "meeting",
  "interview",
  "event",
  "reminder",
  "task",
  "birthday",
  "holiday",
  "deadline",
  "important",
];

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

export const EVENT_STATUSES = ["Scheduled", "Ongoing", "Completed", "Cancelled"];

export const MEETING_PLATFORMS = [
  "google-meet",
  "microsoft-teams",
  "zoom",
  "webex",
  "slack-huddle",
  "custom",
  "",
];

export const RECURRENCE_FREQUENCIES = ["daily", "weekly", "monthly", "custom", "none"];

export const REMINDER_OPTIONS = [5, 10, 15, 30, 60, 1440];

export const isValidHttpUrl = (url) => {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const detectMeetingPlatform = (url) => {
  if (!url) return "";
  try {
    const { host } = new URL(url);
    if (host.includes("meet.google.com")) return "google-meet";
    if (host.includes("teams.microsoft.com") || host.includes("teams.live.com"))
      return "microsoft-teams";
    if (host.includes("zoom.us") || host.includes("zoom.com")) return "zoom";
    if (host.includes("webex.com")) return "webex";
    if (host.includes("huddle") || host.includes("slack.com")) return "slack-huddle";
    return "custom";
  } catch {
    return "custom";
  }
};

export const normalizeTags = (value) => {
  if (Array.isArray(value)) {
    return value.map((t) => sanitizeString(t, 50)).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((t) => t.trim().slice(0, 50))
      .filter(Boolean);
  }
  return [];
};

export const normalizeRecurrence = (value, start) => {
  if (!value || value.enabled === false) {
    return { enabled: false, frequency: "none", interval: 1, daysOfWeek: [], dayOfMonth: null, endDate: null, count: null };
  }
  const frequency = RECURRENCE_FREQUENCIES.includes(value.frequency)
    ? value.frequency
    : "none";
  if (frequency === "none") {
    return { enabled: false, frequency: "none", interval: 1, daysOfWeek: [], dayOfMonth: null, endDate: null, count: null };
  }
  const interval = Math.max(1, Math.min(52, Number(value.interval) || 1));
  const endDate = value.endDate && isDate(value.endDate) ? new Date(value.endDate) : null;
  const count = value.count ? Math.max(1, Math.min(9999, Number(value.count))) : null;
  const startDate = start ? new Date(start) : null;
  if (endDate && startDate && endDate < startDate) {
    throw new Error("Recurrence end date cannot be before the event start");
  }
  return {
    enabled: true,
    frequency,
    interval,
    daysOfWeek:
      frequency === "weekly" || frequency === "custom"
        ? Array.from(
            new Set(
              (Array.isArray(value.daysOfWeek) ? value.daysOfWeek : [])
                .map(Number)
                .filter((d) => d >= 0 && d <= 6)
            )
          ).sort()
        : [],
    dayOfMonth:
      frequency === "monthly" && value.dayOfMonth
        ? Math.max(1, Math.min(31, Number(value.dayOfMonth)))
        : null,
    endDate,
    count,
  };
};

export const normalizeReminders = (value, start) => {
  if (!Array.isArray(value)) return [];
  const startTime = start ? new Date(start).getTime() : Date.now();
  const seen = new Set();
  const out = [];
  for (const item of value) {
    const minutesBefore = Number(item?.minutesBefore);
    if (!Number.isFinite(minutesBefore) || minutesBefore < 0) continue;
    if (seen.has(minutesBefore)) continue;
    seen.add(minutesBefore);
    out.push({
      at: new Date(startTime - minutesBefore * 60 * 1000),
      minutesBefore,
      sentAt: null,
    });
  }
  return out.sort((a, b) => a.at - b.at);
};

export const normalizeParticipants = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((p) => (typeof p === "string" ? p : p?._id || p?.id))
    .filter((p) => typeof p === "string" && isValidObjectId(p));
};

export const normalizeAttendees = (value) => {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const item of value) {
    const isObj = item && typeof item === "object";
    const email = String(isObj ? item.email : item || "").trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push({
      email,
      name: sanitizeString(isObj ? item.name : "", 120),
      required: !(isObj && item.required === false),
    });
  }
  return out;
};

export const validateEventPayload = (body = {}) => {
  const errors = [];

  const title = sanitizeString(body.title, 150);
  if (!title) errors.push("Title is required");

  const start = body.start || body.startTime;
  if (!start || !isDate(start)) errors.push("Start time is required and must be a valid date");

  const end = body.end || body.endTime || null;
  if (end && !isDate(end)) errors.push("End time must be a valid date");
  if (start && end && new Date(end) < new Date(start)) {
    errors.push("End time cannot be before start time");
  }

  const allDay = Boolean(body.allDay);
  const type = EVENT_TYPES.includes(body.type) ? body.type : "meeting";
  const priority = PRIORITIES.includes(body.priority) ? body.priority : "Medium";
  const status = EVENT_STATUSES.includes(body.status) ? body.status : "Scheduled";
  const meetingLink = sanitizeString(body.meetingLink || body.link, 500);
  if (meetingLink && !isValidHttpUrl(meetingLink)) {
    errors.push("Meeting link must be a valid http(s) URL");
  }
  const meetingPlatform = MEETING_PLATFORMS.includes(body.meetingPlatform)
    ? body.meetingPlatform
    : detectMeetingPlatform(meetingLink);

  const categoryName = sanitizeString(body.category?.name || body.category, 60) || "General";
  const categoryColor =
    /^#[0-9a-fA-F]{3,8}$/.test(body.category?.color || "") ? body.category.color : "#3354F4";

  const visibility = body.visibility === "company" ? "company" : "private";
  const timezone = sanitizeString(body.timezone, 80);

  let recurrence = { enabled: false, frequency: "none", interval: 1, daysOfWeek: [], dayOfMonth: null, endDate: null, count: null };
  if (body.recurrence && body.recurrence.enabled) {
    try {
      recurrence = normalizeRecurrence(body.recurrence, start);
    } catch (error) {
      errors.push(error.message);
    }
  }

  const reminders = normalizeReminders(body.reminders, start);

  const attendees = normalizeAttendees(body.attendees);
  for (const attendee of attendees) {
    if (!isValidEmail(attendee.email)) {
      errors.push(`Invalid attendee email: ${attendee.email}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    data: {
      title,
      description: sanitizeString(body.description, 5000),
      start: start ? new Date(start) : undefined,
      end: end ? new Date(end) : null,
      allDay,
      timezone,
      type,
      category: { name: categoryName, color: categoryColor },
      priority,
      status,
      location: sanitizeString(body.location, 300),
      isOnlineMeeting: Boolean(body.isOnlineMeeting) || Boolean(body.teamsMeeting),
      meetingLink,
      meetingPlatform,
      attendees,
      tags: normalizeTags(body.tags),
      notes: sanitizeString(body.notes, 5000),
      agenda: sanitizeString(body.agenda, 5000),
      participants: normalizeParticipants(body.participants),
      visibility,
      recurrence,
      reminders,
    },
  };
};
