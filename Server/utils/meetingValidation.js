import { isValidObjectId, isDate, sanitizeString } from "./validation.js";

export const MEETING_TYPES = ["instant", "scheduled", "personal-room"];
export const MEETING_STATUSES = ["upcoming", "live", "completed", "cancelled"];

export const normalizeDuration = (value) => {
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return 60;
  return Math.max(5, Math.min(1440, Math.round(minutes)));
};

export const normalizeMeetingParticipants = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((p) => (typeof p === "string" ? p : p?._id || p?.id))
    .filter((id) => typeof id === "string" && isValidObjectId(id));
};

export const normalizeInterviewers = (value) => normalizeMeetingParticipants(value);

const clampString = (value, max) => sanitizeString(value, max);

const normalizeSettings = (body = {}) => {
  const s = body.settings || body;
  const toBool = (v, dflt) => (typeof v === "boolean" ? v : dflt);
  return {
    waitingRoom: toBool(s.waitingRoom, true),
    hostApproval: toBool(s.hostApproval, true),
    requirePassword: toBool(s.requirePassword, false),
    meetingPassword: clampString(s.meetingPassword, 100),
    recordMeeting: toBool(s.recordMeeting, true),
    allowChat: toBool(s.allowChat, true),
    allowScreenShare: toBool(s.allowScreenShare, true),
    allowParticipantsMic: toBool(s.allowParticipantsMic, true),
    allowParticipantsCamera: toBool(s.allowParticipantsCamera, true),
    autoSummary: toBool(s.autoSummary, true),
    restrictPermissions: toBool(s.restrictPermissions, false),
    breakoutsEnabled: toBool(s.breakoutsEnabled, false),
  };
};

/**
 * Validate the incoming meeting payload and return a sanitized object.
 */
export const validateMeetingPayload = (body = {}) => {
  const errors = [];

  const title = clampString(body.title, 150);
  if (!title) errors.push("Title is required");

  const type = MEETING_TYPES.includes(body.type) ? body.type : "scheduled";
  const duration = normalizeDuration(body.duration);

  const start = type === "scheduled" ? body.start || null : new Date();
  if (type === "scheduled" && (!start || !isDate(start))) {
    errors.push("Start time is required and must be a valid date");
  }

  const end = body.end || null;
  if (end && !isDate(end)) errors.push("End time must be a valid date");
  if (start && end && new Date(end) < new Date(start)) {
    errors.push("End time cannot be before start time");
  }

  const candidate = isValidObjectId(body.candidate) ? body.candidate : null;

  return {
    ok: errors.length === 0,
    errors,
    data: {
      title,
      description: clampString(body.description, 5000),
      agenda: clampString(body.agenda, 5000),
      timezone: clampString(body.timezone, 80),
      type,
      duration,
      start: start ? new Date(start) : new Date(),
      end: end ? new Date(end) : null,
      interviewers: normalizeInterviewers(body.interviewers || body.panel),
      candidate,
      interview: isValidObjectId(body.interview) ? body.interview : null,
      guestJoinEnabled: body.guestJoinEnabled !== false,
      waitingRoomEnabled: body.waitingRoomEnabled !== false,
      hostApprovalRequired: body.hostApprovalRequired !== false,
      passwordProtected: Boolean(body.passwordProtected),
      settings: normalizeSettings(body),
    },
  };
};
