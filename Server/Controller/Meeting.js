import Meeting from "../model/Meeting.model.js";
import { MeetingParticipant } from "../model/Participant.model.js";
import { MeetingInvitation } from "../model/Invitation.model.js";
import { MeetingChannel } from "../model/Channel.model.js";
import { MeetingMessage } from "../model/MeetingMessage.model.js";
import CalendarEvent from "../model/CalendarEvent.model.js";
import { Employee } from "../model/Employee.model.js";
import Candidate from "../model/Candidate.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { isValidObjectId } from "../utils/validation.js";
import {
  validateMeetingPayload,
  MEETING_STATUSES,
  normalizeDuration,
  normalizeInterviewers,
} from "../utils/meetingValidation.js";
import { logActivity } from "../utils/activityLogger.js";
import { notify } from "../utils/notificationService.js";
import {
  generateMeetingId,
  signMeetingLink,
  generateOtp,
  generateToken,
  hashValue,
  verifyHash,
  signGuestToken,
  fingerprint,
} from "../utils/meetingSecurity.js";
import {
  sendMeetingInvitationEmail,
  sendGuestInvitationEmail,
  sendGuestOtpEmail,
} from "../utils/meetingEmail.js";

const HR_ROLES = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"];

const isHR = (req) => HR_ROLES.includes(req.employee?.role || req.user?.role);

const ORIGIN = process.env.FRONTEND_URL || "http://localhost:5173";

const meetingJoinUrl = (meeting) =>
  `${ORIGIN}/meeting/${meeting.meetingId}`;

const guestJoinUrl = (meeting, token) =>
  `${ORIGIN}/join/${meeting.meetingId}?invite=${token}`;

export const toClientMeeting = (m) => {
  const plain = m?.toObject ? m.toObject() : m;
  if (!plain) return null;
  return {
    ...plain,
    joinUrl: plain.meetingId ? meetingJoinUrl(plain) : "",
  };
};

const emitMeeting = (io, action, payload, recipients = []) => {
  if (!io) return;
  const meetingId = payload?.meetingId || payload?.meeting;
  if (meetingId) {
    try {
      io.to(`meeting:${meetingId}`).emit(action, payload);
    } catch (error) {
      console.error("Meeting socket emit failed:", error.message);
    }
  }
  const ids = new Set(
    [payload?.organizer?._id || payload?.organizer, ...(payload?.participants || [])]
      .filter(Boolean)
      .map(String)
  );
  recipients.forEach((r) => ids.add(String(r)));
  ids.forEach((id) => {
    try {
      io.to(`user:${id}`).emit(action, payload);
    } catch (error) {
      console.error("Meeting user emit failed:", error.message);
    }
  });
};

const createChannelForMeeting = async ({ companyId, meeting, organizer }) => {
  const channel = await MeetingChannel.create({
    companyId,
    meeting: meeting._id,
    name: meeting.title,
    description: meeting.agenda || meeting.description || "",
    createdBy: organizer,
    members: [
      organizer,
      ...(meeting.interviewers || []),
    ].filter((id, i, arr) => id && arr.indexOf(id) === i),
  });
  meeting.channelId = channel._id;
  await meeting.save();
  return channel;
};

const syncCalendarEvent = async (req, meeting) => {
  const filter = { _id: meeting.calendarEventId };
  if (filter._id && !(await CalendarEvent.exists(filter))) {
    filter._id = null;
  }
  const start = meeting.start || new Date();
  const end = meeting.end || new Date(start.getTime() + meeting.duration * 60000);
  const payload = {
    company: req.companyId || meeting.company,
    title: meeting.title,
    description: [meeting.description, meeting.agenda].filter(Boolean).join("\n"),
    start,
    end,
    type: "meeting",
    meetingPlatform: "custom",
    organizer: meeting.organizer,
    participants: meeting.interviewers || [],
    priority: "Medium",
    status: "Scheduled",
    meetingLink: meetingJoinUrl(meeting),
    source: "system",
    sourceId: meeting._id,
    sourceRef: "Meeting",
    meeting: meeting._id,
    link: meetingJoinUrl(meeting),
    recurrence: meeting.recurrence?.enabled ? meeting.recurrence : undefined,
  };

  let event = meeting.calendarEventId
    ? await CalendarEvent.findOne(filter)
    : null;

  if (event) {
    Object.assign(event, payload);
    await event.save();
  } else {
    event = await CalendarEvent.create(payload);
    meeting.calendarEventId = event._id;
    await meeting.save();
  }
  return event;
};

const sendInviteEmails = async (meeting, employeeIds) => {
  const users = await Employee.find({ _id: { $in: employeeIds } }).select(
    "name email"
  );
  for (const user of users) {
    const url = meetingJoinUrl(meeting);
    await sendMeetingInvitationEmail({
      to: user.email,
      name: user.name,
      meeting,
      meetingUrl: url,
    }).catch(() => {});
  }
};

const notifyParticipantEmployees = async (req, meeting, employeeIds, extra = {}) => {
  for (const id of employeeIds) {
    if (String(id) === String(meeting.organizer?._id || meeting.organizer)) continue;
    if (String(id) === String(req.user.id)) continue;
    await notify({
      io: req.io,
      recipient: id,
      companyId: req.companyId || meeting.company,
      title: extra.title || `New meeting: ${meeting.title}`,
      message:
        extra.message ||
        `${meeting.title} has been scheduled for ${new Date(meeting.start).toLocaleString()}`,
      type: "system",
      link: `/meeting/${meeting.meetingId}`,
    });
  }
};

const log = async (req, meeting, action, details = "") =>
  logActivity({
    companyId: req.companyId || meeting.company,
    actor: req.user.id,
    action,
    module: "meeting",
    targetType: "Meeting",
    targetId: meeting._id,
    details: `${details || action} — ${meeting.title}`,
    ip: req.ip,
  });

/**
 * Creates a real scheduled Meeting record for a Calendar event (the same
 * mechanism used by the Meeting module) and links it back via calendarEventId.
 * Returns the created meeting.
 */
export const createOnlineMeetingForCalendar = async ({
  companyId,
  organizerId,
  title,
  description = "",
  agenda = "",
  timezone = "",
  start,
  end,
  duration,
  calendarEventId,
}) => {
  const startDate = start ? new Date(start) : new Date();
  const endDate = end ? new Date(end) : new Date(startDate.getTime() + 60 * 60000);
  const meetingId = generateMeetingId();
  const meeting = await Meeting.create({
    company: companyId,
    title: String(title || "Meeting").trim().slice(0, 200),
    description: String(description || "").slice(0, 2000),
    agenda: String(agenda || "").slice(0, 2000),
    timezone: String(timezone || "").slice(0, 80),
    start: startDate,
    end: endDate,
    duration: Math.max(5, Math.min(1440, Number(duration) || Math.max(30, Math.round((endDate - startDate) / 60000)) || 60)),
    type: "scheduled",
    meetingId,
    status: "upcoming",
    encryptedLink: signMeetingLink({ meetingId, purpose: "join" }),
    organizer: organizerId,
    calendarEventId,
  });
  await createChannelForMeeting({ companyId, meeting, organizer: organizerId });
  return meeting;
};

/** Cancels a linked meeting (used when its calendar event is cancelled). */
export const cancelOnlineMeetingForCalendar = async ({ meetingId }) => {
  if (!meetingId) return null;
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) return null;
  if (meeting.status !== "cancelled") {
    meeting.status = "cancelled";
    meeting.endedAt = new Date();
    await meeting.save();
  }
  return meeting;
};

/** Deletes a linked meeting and its related records (no orphaned records). */
export const deleteOnlineMeetingForCalendar = async ({ meetingId }) => {
  if (!meetingId) return null;
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) return null;
  await MeetingChannel.deleteMany({ meeting: meeting._id });
  await MeetingMessage.deleteMany({ meeting: meeting._id });
  await MeetingParticipant.deleteMany({ meeting: meeting._id });
  await MeetingInvitation.deleteMany({ meeting: meeting._id });
  await meeting.deleteOne();
  return meeting;
};

export const createMeeting = async (req, res) => {
  try {
    const { ok, errors, data } = validateMeetingPayload(req.body || {});
    if (!ok) {
      return res.status(400).json(new ApiError(400, errors.join(". "), errors));
    }

    const meetingId = data.type === "personal-room" ? generateMeetingId() : generateMeetingId();
    const isPersonalRoom = data.type === "personal-room";
    const isInstant = data.type === "instant";

    const meeting = await Meeting.create({
      company: req.companyId,
      ...data,
      meetingId,
      status: isInstant ? "live" : "upcoming",
      encryptedLink: signMeetingLink({ meetingId, purpose: "join" }),
      organizer: req.user.id,
      settings: {
        ...data.settings,
        meetingPassword: data.settings.requirePassword
          ? data.settings.meetingPassword
          : "",
      },
      personalRoomOwner: isPersonalRoom ? req.user.id : null,
      startedAt: isInstant ? new Date() : null,
    });

    const channel = await createChannelForMeeting({
      companyId: req.companyId,
      meeting,
      organizer: req.user.id,
    });

    if (data.type !== "personal-room") {
      await syncCalendarEvent(req, meeting);
    }

    const populated = await meeting.populate([
      { path: "organizer", select: "name email role profileImg designation" },
      { path: "interviewers", select: "name email role profileImg designation" },
      { path: "candidate", select: "firstName lastName email" },
    ]);

    emitMeeting(req.io, "meeting:created", toClientMeeting(populated), [
      req.user.id,
      ...(data.interviewers || []).map(String),
    ]);

    await sendInviteEmails(populated, data.interviewers || []);
    await notifyParticipantEmployees(req, populated, data.interviewers || []);
    await log(req, meeting, "meeting.created");

    return res.status(201).json(
      new ApiResponse(
        201,
        { ...toClientMeeting(populated), channel: channel.toObject() },
        isPersonalRoom ? "Personal room ready" : "Meeting created successfully"
      )
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getMyPersonalRoom = async (req, res) => {
  try {
    let room = await Meeting.findOne({
      company: req.companyId,
      type: "personal-room",
      personalRoomOwner: req.user.id,
    })
      .populate("organizer", "name email role profileImg")
      .lean();
    if (!room) {
      const created = await createMeetingInternal(req, {
        title: `${req.employee?.name || "My"} Personal Room`,
        description: "Your personal meeting room. Share the link to let people join.",
        type: "personal-room",
        duration: 60,
        guestJoinEnabled: true,
        waitingRoomEnabled: false,
        hostApprovalRequired: false,
        settings: { waitingRoom: false, hostApproval: false, recordMeeting: true },
      });
      return res
        .status(201)
        .json(new ApiResponse(201, toClientMeeting(created), "Personal room created"));
    }
    return res.status(200).json(new ApiResponse(200, toClientMeeting(room)));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const createMeetingInternal = async (req, body) => {
  const { ok, errors, data } = validateMeetingPayload(body || {});
  if (!ok) throw new Error(errors.join(". "));
  const meetingId = generateMeetingId();
  const meeting = await Meeting.create({
    company: req.companyId,
    ...data,
    meetingId,
    status: "upcoming",
    encryptedLink: signMeetingLink({ meetingId, purpose: "join" }),
    organizer: req.user.id,
    personalRoomOwner: body.type === "personal-room" ? req.user.id : null,
  });
  return meeting;
};

export const getMeetings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = "",
      type = "",
      search = "",
      tab = "",
      from = "",
      to = "",
    } = req.query;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const filter = { company: req.companyId };
    const canSeeAll = isHR(req);
    if (!canSeeAll) {
      filter.$or = [{ organizer: req.user.id }, { interviewers: req.user.id }];
    }

    if (tab === "upcoming") {
      filter.status = { $in: ["upcoming"] };
      filter.start = { $gte: now };
    } else if (tab === "today") {
      filter.status = { $in: ["upcoming", "live"] };
      filter.start = { $gte: startOfToday, $lte: new Date(startOfToday.getTime() + 24 * 3600000) };
    } else if (tab === "recent") {
      filter.status = { $in: ["completed", "live"] };
      filter.end = { $gte: new Date(now.getTime() - 7 * 24 * 3600000) };
    } else if (tab === "completed") {
      filter.status = "completed";
    } else if (tab === "missed") {
      filter.status = "completed";
      filter.missedReason = { $ne: "" };
    } else if (tab === "interview") {
      filter.candidate = { $ne: null };
    } else if (tab === "personal-room") {
      filter.type = "personal-room";
    }

    if (status && MEETING_STATUSES.includes(status)) filter.status = status;
    if (type) filter.type = type;
    if (from || to) {
      filter.start = {};
      if (from) filter.start.$gte = new Date(from);
      if (to) filter.start.$lte = new Date(to);
    }
    if (search) {
      const re = new RegExp(search, "i");
      filter.$text = undefined;
      filter.$or = filter.$or || [];
      filter.$or.push({ title: re }, { meetingId: re });
      if (filter.$or.length === 1) filter.$or = filter.$or[0];
    }

    const baseQuery = Meeting.find(filter)
      .populate("organizer", "name email role profileImg designation")
      .populate("interviewers", "name email role profileImg designation")
      .populate("candidate", "firstName lastName email")
      .sort({ start: -1 });

    const [data, total] = await Promise.all([
      baseQuery
        .clone()
        .skip((p - 1) * l)
        .limit(l),
      Meeting.countDocuments(filter),
    ]);

    const upcoming = await Meeting.countDocuments({
      company: req.companyId,
      status: "upcoming",
      start: { $gte: now },
      ...(canSeeAll ? {} : { $or: [{ organizer: req.user.id }, { interviewers: req.user.id }] }),
    });
    const liveCount = await Meeting.countDocuments({
      company: req.companyId,
      status: "live",
      ...(canSeeAll ? {} : { $or: [{ organizer: req.user.id }, { interviewers: req.user.id }] }),
    });

    return res.status(200).json(
      new ApiResponse(200, {
        data: data.map(toClientMeeting),
        total,
        page: p,
        limit: l,
        hasMore: p * l < total,
        counts: { upcoming, live: liveCount },
      })
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getMeetingByMeetingId = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findOne({
      company: req.companyId,
      meetingId,
    })
      .populate("organizer", "name email role profileImg designation")
      .populate("interviewers", "name email role profileImg designation")
      .populate("candidate", "firstName lastName email")
      .populate("channelId", "name members");
    if (!meeting) {
      return res.status(404).json(new ApiError(404, "Meeting not found"));
    }
    return res.status(200).json(new ApiResponse(200, toClientMeeting(meeting)));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid meeting ID"));
    }
    const meeting = await Meeting.findOne({ _id: id, company: req.companyId })
      .populate("organizer", "name email role profileImg designation")
      .populate("interviewers", "name email role profileImg designation")
      .populate("candidate", "firstName lastName email")
      .populate("channelId", "name members");
    if (!meeting) {
      return res.status(404).json(new ApiError(404, "Meeting not found"));
    }
    return res.status(200).json(new ApiResponse(200, toClientMeeting(meeting)));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid meeting ID"));
    }
    const meeting = await Meeting.findOne({ _id: id, company: req.companyId });
    if (!meeting) {
      return res.status(404).json(new ApiError(404, "Meeting not found"));
    }
    const isOrganizer =
      String(meeting.organizer) === String(req.user.id) || isHR(req);
    if (!isOrganizer) {
      return res.status(403).json(new ApiError(403, "Only the organizer can update this meeting"));
    }

    const { ok, errors, data } = validateMeetingPayload({
      ...meeting.toObject(),
      ...(req.body || {}),
    });
    if (!ok) {
      return res.status(400).json(new ApiError(400, errors.join(". "), errors));
    }

    Object.assign(meeting, data);
    if (data.settings.requirePassword) {
      meeting.settings.meetingPassword = data.settings.meetingPassword;
    } else {
      meeting.settings.meetingPassword = "";
    }
    meeting.passwordProtected = Boolean(data.settings.requirePassword);
    await meeting.save();

    if (meeting.calendarEventId) {
      await syncCalendarEvent(req, meeting);
    }

    const populated = await meeting.populate([
      { path: "organizer", select: "name email role profileImg" },
      { path: "interviewers", select: "name email role profileImg" },
      { path: "candidate", select: "firstName lastName email" },
    ]);
    emitMeeting(req.io, "meeting:updated", toClientMeeting(populated), [
      req.user.id,
      ...(meeting.interviewers || []).map(String),
    ]);
    await log(req, meeting, "meeting.updated");
    return res.status(200).json(new ApiResponse(200, toClientMeeting(populated), "Meeting updated"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const cancelMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid meeting ID"));
    }
    const meeting = await Meeting.findOne({ _id: id, company: req.companyId });
    if (!meeting) {
      return res.status(404).json(new ApiError(404, "Meeting not found"));
    }
    const isOrganizer = String(meeting.organizer) === String(req.user.id) || isHR(req);
    if (!isOrganizer) {
      return res.status(403).json(new ApiError(403, "Only the organizer can cancel this meeting"));
    }
    meeting.status = "cancelled";
    meeting.endedAt = new Date();
    await meeting.save();

    if (meeting.calendarEventId) {
      await CalendarEvent.updateOne(
        { _id: meeting.calendarEventId },
        { status: "Cancelled" }
      );
    }
    await MeetingParticipant.updateMany(
      { meeting: meeting._id, status: { $nin: ["joined", "left"] } },
      { status: "declined" }
    );
    emitMeeting(req.io, "meeting:cancelled", toClientMeeting(meeting), [
      req.user.id,
      ...(meeting.interviewers || []).map(String),
    ]);
    await log(req, meeting, "meeting.cancelled");
    return res.status(200).json(new ApiResponse(200, toClientMeeting(meeting), "Meeting cancelled"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid meeting ID"));
    }
    const meeting = await Meeting.findOne({ _id: id, company: req.companyId });
    if (!meeting) {
      return res.status(404).json(new ApiError(404, "Meeting not found"));
    }
    const isOrganizer = String(meeting.organizer) === String(req.user.id) || isHR(req);
    if (!isOrganizer) {
      return res.status(403).json(new ApiError(403, "Only the organizer can delete this meeting"));
    }
    const snapshot = toClientMeeting(meeting);
    await MeetingChannel.deleteMany({ meeting: meeting._id });
    await MeetingMessage.deleteMany({ meeting: meeting._id });
    await MeetingParticipant.deleteMany({ meeting: meeting._id });
    await MeetingInvitation.deleteMany({ meeting: meeting._id });
    await CalendarEvent.deleteMany({ _id: meeting.calendarEventId });
    await meeting.deleteOne();
    await log(req, meeting, "meeting.deleted");
    return res.status(200).json(new ApiResponse(200, snapshot, "Meeting deleted"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const startMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid meeting ID"));
    }
    const meeting = await Meeting.findOne({ _id: id, company: req.companyId });
    if (!meeting) {
      return res.status(404).json(new ApiError(404, "Meeting not found"));
    }
    const isOrganizer = String(meeting.organizer) === String(req.user.id) || isHR(req);
    if (!isOrganizer) {
      return res.status(403).json(new ApiError(403, "Only the organizer can start this meeting"));
    }
    meeting.status = "live";
    meeting.startedAt = meeting.startedAt || new Date();
    await meeting.save();

    if (meeting.calendarEventId) {
      await CalendarEvent.updateOne(
        { _id: meeting.calendarEventId },
        { status: "Ongoing" }
      );
    }

    const targets = new Set(
      (meeting.interviewers || []).map((p) => String(p?._id || p)).filter((p) => p !== String(req.user.id))
    );
    targets.add(String(meeting.organizer?._id || meeting.organizer));
    for (const t of targets) {
      if (String(t) === String(req.user.id)) continue;
      await notify({
        io: req.io,
        recipient: t,
        companyId: meeting.company,
        title: `Meeting started: ${meeting.title}`,
        message: `${meeting.title} has started. Join now!`,
        type: "system",
        link: `/meeting/${meeting.meetingId}`,
      });
    }

    emitMeeting(req.io, "meeting:started", toClientMeeting(meeting), [
      req.user.id,
      ...(meeting.interviewers || []).map(String),
    ]);
    await log(req, meeting, "meeting.started");
    return res.status(200).json(new ApiResponse(200, toClientMeeting(meeting), "Meeting started"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const endMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid meeting ID"));
    }
    const meeting = await Meeting.findOne({ _id: id, company: req.companyId });
    if (!meeting) {
      return res.status(404).json(new ApiError(404, "Meeting not found"));
    }
    const isOrganizer = String(meeting.organizer) === String(req.user.id) || isHR(req);
    if (!isOrganizer) {
      return res.status(403).json(new ApiError(403, "Only the organizer can end this meeting"));
    }
    meeting.status = "completed";
    meeting.endedAt = new Date();
    await meeting.save();

    if (meeting.calendarEventId) {
      await CalendarEvent.updateOne(
        { _id: meeting.calendarEventId },
        { status: "Completed", completedAt: new Date() }
      );
    }

    await MeetingParticipant.updateMany(
      { meeting: meeting._id, status: "joined" },
      { status: "left", "attendance.leftAt": new Date() }
    );

    const invited = await MeetingParticipant.find({
      meeting: meeting._id,
      status: { $in: ["invited", "accepted", "no-show"] },
    });
    for (const p of invited) {
      if (!p.employee) continue;
      await notify({
        io: req.io,
        recipient: p.employee,
        companyId: meeting.company,
        title: `Meeting ended: ${meeting.title}`,
        message: `${meeting.title} has ended. Check the recording and notes.`,
        type: "system",
        link: `/meeting/${meeting.meetingId}`,
      });
    }

    emitMeeting(req.io, "meeting:ended", toClientMeeting(meeting), [
      req.user.id,
      ...(meeting.interviewers || []).map(String),
    ]);
    await log(req, meeting, "meeting.ended");
    return res.status(200).json(new ApiResponse(200, toClientMeeting(meeting), "Meeting ended"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const joinMeeting = async (req, res) => {
  try {
    const meetingId = req.params.meetingId || req.params.id;
    const meeting = await Meeting.findOne({ company: req.companyId, meetingId });
    if (!meeting) {
      return res.status(404).json(new ApiError(404, "Meeting not found"));
    }
    if (meeting.status === "cancelled") {
      return res.status(400).json(new ApiError(400, "This meeting has been cancelled"));
    }

    const isOrganizer =
      String(meeting.organizer?._id || meeting.organizer) === String(req.user.id);
    const isInterviewer = (meeting.interviewers || []).some(
      (p) => String(p?._id || p) === String(req.user.id)
    );
    const isHRUser = isHR(req);

    let participant = await MeetingParticipant.findOne({
      meeting: meeting._id,
      employee: req.user.id,
    });

    const role = isOrganizer
      ? "host"
      : isInterviewer
        ? "interviewer"
        : isHRUser
          ? "moderator"
          : "attendee";

    const autoAdmit = isOrganizer || isInterviewer || isHRUser;

    if (!participant) {
      const emp = req.employee;
      participant = await MeetingParticipant.create({
        companyId: req.companyId,
        meeting: meeting._id,
        employee: req.user.id,
        name: emp?.name || "",
        email: emp?.email || "",
        participantType: "employee",
        role,
        status: autoAdmit ? "admitted" : meeting.waitingRoomEnabled ? "waiting" : "admitted",
        verified: true,
        deviceInfo: {
          userAgent: req.get("user-agent") || "",
          platform: req.get("user-agent") || "",
          ip: req.ip || "",
        },
      });
    } else if (participant.status !== "joined") {
      participant.role = role;
      if (autoAdmit || !meeting.waitingRoomEnabled) {
        participant.status = "admitted";
      } else if (participant.status === "invited" || participant.status === "accepted") {
        participant.status = "waiting";
      }
      await participant.save();
    }

    const populated = await meeting.populate([
      { path: "organizer", select: "name email role profileImg" },
      { path: "interviewers", select: "name email role profileImg" },
      { path: "candidate", select: "firstName lastName email" },
    ]);

    const guests = await MeetingInvitation.find({
      meeting: meeting._id,
      status: "accepted",
    }).countDocuments();

    const live = await MeetingParticipant.countDocuments({
      meeting: meeting._id,
      status: "joined",
    });

    return res.status(200).json(
      new ApiResponse(200, {
        meeting: toClientMeeting(populated),
        participant: participant.toObject(),
        liveCount: live + guests,
      })
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const createInstantMeeting = async (req, res) => {
  try {
    const body = req.body || {};
    const payload = {
      title: body.title || "Instant Meeting",
      agenda: body.agenda || "",
      description: body.description || "Started instantly from the meetings dashboard.",
      type: "instant",
      duration: normalizeDuration(body.duration || 60),
      interviewers: normalizeInterviewers(body.interviewers || body.panel),
      candidate: body.candidate || undefined,
      guestJoinEnabled: body.guestJoinEnabled !== false,
      settings: {
        waitingRoom: body.waitingRoomEnabled !== false,
        hostApproval: body.hostApprovalRequired !== false,
        recordMeeting: true,
      },
    };
    const { ok, errors, data } = validateMeetingPayload(payload);
    if (!ok) {
      return res.status(400).json(new ApiError(400, errors.join(". "), errors));
    }
    const meetingId = generateMeetingId();
    const meeting = await Meeting.create({
      company: req.companyId,
      ...data,
      meetingId,
      status: "live",
      startedAt: new Date(),
      encryptedLink: signMeetingLink({ meetingId, purpose: "join" }),
      organizer: req.user.id,
    });
    await createChannelForMeeting({
      companyId: req.companyId,
      meeting,
      organizer: req.user.id,
    });
    await syncCalendarEvent(req, meeting);
    const populated = await meeting.populate("organizer", "name email role profileImg");
    await log(req, meeting, "meeting.created_instant");
    return res
      .status(201)
      .json(new ApiResponse(201, toClientMeeting(populated), "Instant meeting started"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid meeting ID"));
    }
    const data = await MeetingParticipant.find({ meeting: id })
      .populate("employee", "name email role profileImg designation")
      .sort({ createdAt: 1 });
    return res.status(200).json(new ApiResponse(200, data, "Participants fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateParticipant = async (req, res) => {
  try {
    const { id, participantId } = req.params;
    if (!isValidObjectId(id) || !isValidObjectId(participantId)) {
      return res.status(400).json(new ApiError(400, "Invalid ID"));
    }
    const meeting = await Meeting.findOne({ _id: id, company: req.companyId });
    if (!meeting) return res.status(404).json(new ApiError(404, "Meeting not found"));
    const isHost = String(meeting.organizer?._id || meeting.organizer) === String(req.user.id) || isHR(req);
    if (!isHost) {
      return res.status(403).json(new ApiError(403, "Only the host can update participants"));
    }
    const { status, role } = req.body || {};
    const participant = await MeetingParticipant.findOneAndUpdate(
      { _id: participantId, meeting: meeting._id },
      {
        ...(status ? { status } : {}),
        ...(role ? { role } : {}),
        ...(status === "admitted" ? { verified: true } : {}),
      },
      { new: true }
    );
    if (!participant) return res.status(404).json(new ApiError(404, "Participant not found"));
    emitMeeting(req.io, "meeting:participant:updated", participant.toObject(), [meeting.meetingId]);
    if (req.io) {
      req.io
        .to(`waiting:${meeting.meetingId}`)
        .emit("meeting:admitted", { meetingId: meeting.meetingId });
    }
    await log(req, meeting, `meeting.participant.${status || "updated"}`, participant.name);
    return res.status(200).json(new ApiResponse(200, participant, "Participant updated"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const admitParticipant = async (req, res) => {
  req.body = { ...(req.body || {}), status: "admitted" };
  return updateParticipant(req, res);
};

export const removeParticipant = async (req, res) => {
  try {
    const { id, participantId } = req.params;
    if (!isValidObjectId(id) || !isValidObjectId(participantId)) {
      return res.status(400).json(new ApiError(400, "Invalid ID"));
    }
    const meeting = await Meeting.findOne({ _id: id, company: req.companyId });
    if (!meeting) return res.status(404).json(new ApiError(404, "Meeting not found"));
    const isHost = String(meeting.organizer?._id || meeting.organizer) === String(req.user.id) || isHR(req);
    if (!isHost) {
      return res.status(403).json(new ApiError(403, "Only the host can remove participants"));
    }
    const participant = await MeetingParticipant.findOneAndUpdate(
      { _id: participantId, meeting: meeting._id },
      { status: "left", "attendance.leftAt": new Date() },
      { new: true }
    );
    if (!participant) return res.status(404).json(new ApiError(404, "Participant not found"));
    emitMeeting(req.io, "meeting:participant:removed", participant.toObject(), [meeting.meetingId]);
    await log(req, meeting, "meeting.participant.removed", participant.name);
    return res.status(200).json(new ApiResponse(200, participant, "Participant removed"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const createGuestInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid meeting ID"));
    }
    const meeting = await Meeting.findOne({ _id: id, company: req.companyId });
    if (!meeting) return res.status(404).json(new ApiError(404, "Meeting not found"));
    if (!meeting.guestJoinEnabled) {
      return res.status(403).json(new ApiError(403, "Guest joining is disabled for this meeting"));
    }

    const { name = "", email, inviteeType = "guest", candidate } = req.body || {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json(new ApiError(400, "A valid email is required"));
    }

    const existing = await MeetingInvitation.findOne({
      meeting: meeting._id,
      email: email.toLowerCase(),
      status: { $in: ["pending", "sent"] },
    });

    if (existing) {
      const url = guestJoinUrl(meeting, existing.token);
      return res.status(200).json(
        new ApiResponse(200, { invitation: existing, joinUrl: url }, "Invitation already sent")
      );
    }

    const token = generateToken(32);
    const otp = generateOtp(6);
    const invitation = await MeetingInvitation.create({
      companyId: req.companyId,
      meeting: meeting._id,
      inviteeType,
      name,
      email: email.toLowerCase(),
      token,
      otp: await hashValue(otp),
      otpExpiresAt: new Date(Date.now() + 10 * 60000),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
      status: "sent",
      createdBy: req.user.id,
      ...(inviteeType === "candidate" && candidate ? { candidate } : {}),
    });

    const url = guestJoinUrl(meeting, token);
    const meetingForMail = {
      ...meeting.toObject(),
      expiresAt: invitation.expiresAt,
    };
    await sendGuestInvitationEmail({
      to: email,
      name,
      meeting: meetingForMail,
      joinUrl: url,
    });
    await sendGuestOtpEmail({ to: email, name, otp });

    if (meeting.candidate) {
      await MeetingParticipant.findOneAndUpdate(
        { meeting: meeting._id, candidate: meeting.candidate },
        { $setOnInsert: { invitation: invitation._id } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    await log(req, meeting, "meeting.invitation.created", email);
    return res.status(201).json(
      new ApiResponse(201, { invitation, joinUrl: url }, "Guest invitation sent")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getInvitationByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await MeetingInvitation.findOne({ token }).populate(
      "meeting",
      "title meetingId description agenda start end duration type organizer settings status waitingRoomEnabled hostApprovalRequired"
    );
    if (!invitation) {
      return res.status(404).json(new ApiError(404, "Invitation not found or has expired"));
    }
    if (invitation.status === "revoked") {
      return res.status(400).json(new ApiError(400, "This invitation has been revoked"));
    }
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      invitation.status = "expired";
      await invitation.save();
      return res.status(410).json(new ApiError(410, "This invitation link has expired"));
    }
    const meeting = await Meeting.findById(invitation.meeting).populate(
      "organizer",
      "name email"
    );
    return res.status(200).json(
      new ApiResponse(200, {
        invitation: invitation.toObject(),
        meeting: toClientMeeting(meeting),
        otpSent: true,
      })
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const verifyGuestOtp = async (req, res) => {
  try {
    const { token, email, otp } = req.body || {};
    if (!token || !email || !otp) {
      return res.status(400).json(new ApiError(400, "Token, email and OTP are required"));
    }
    const invitation = await MeetingInvitation.findOne({ token });
    if (!invitation) {
      return res.status(404).json(new ApiError(404, "Invitation not found"));
    }
    if (invitation.status === "revoked") {
      return res.status(400).json(new ApiError(400, "This invitation has been revoked"));
    }
    if (invitation.usedAt) {
      return res.status(400).json(new ApiError(400, "This invitation has already been used"));
    }
    if (String(invitation.email).toLowerCase() !== String(email).toLowerCase()) {
      return res.status(400).json(new ApiError(400, "Email does not match the invitation"));
    }
    if (!invitation.otpExpiresAt || new Date(invitation.otpExpiresAt) < new Date()) {
      return res.status(400).json(new ApiError(400, "Verification code has expired. Request a new one."));
    }
    const match = await verifyHash(otp, invitation.otp);
    if (!match) {
      return res.status(400).json(new ApiError(400, "Invalid verification code"));
    }

    invitation.otp = "";
    invitation.otpExpiresAt = null;
    invitation.usedAt = new Date();
    invitation.status = "accepted";
    await invitation.save();

    const meeting = await Meeting.findById(invitation.meeting);
    if (!meeting) return res.status(404).json(new ApiError(404, "Meeting not found"));

    const sessionId = generateToken(12);
    const guestToken = signGuestToken({
      meetingId: meeting.meetingId,
      email: invitation.email,
      name: invitation.name || "",
      sessionId,
    });

    const participant = await MeetingParticipant.create({
      companyId: meeting.company,
      meeting: meeting._id,
      invitation: invitation._id,
      name: invitation.name || invitation.email,
      email: invitation.email,
      participantType: invitation.inviteeType === "candidate" ? "candidate" : "guest",
      role: invitation.inviteeType === "candidate" ? "candidate" : "attendee",
      status: meeting.waitingRoomEnabled ? "waiting" : "admitted",
      joinToken: sessionId,
      verified: true,
      deviceInfo: { userAgent: req.get("user-agent") || "", ip: req.ip || "" },
    });

    await log(req, meeting, "meeting.guest.verified", invitation.email);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          guestToken,
          meeting: toClientMeeting(meeting),
          participant: participant.toObject(),
        },
        "Identity verified — you can join now"
      )
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const resendGuestOtp = async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json(new ApiError(400, "Token is required"));
    const invitation = await MeetingInvitation.findOne({ token });
    if (!invitation) return res.status(404).json(new ApiError(404, "Invitation not found"));
    if (invitation.usedAt) {
      return res.status(400).json(new ApiError(400, "Invitation already used"));
    }
    const otp = generateOtp(6);
    invitation.otp = await hashValue(otp);
    invitation.otpExpiresAt = new Date(Date.now() + 10 * 60000);
    await invitation.save();
    await sendGuestOtpEmail({ to: invitation.email, name: invitation.name, otp });
    return res.status(200).json(new ApiResponse(200, null, "A new code has been sent"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getAttendanceReport = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid meeting ID"));
    }
    const meeting = await Meeting.findById(id);
    if (!meeting) return res.status(404).json(new ApiError(404, "Meeting not found"));

    const [participants, totalInvited, joinedCount] = await Promise.all([
      MeetingParticipant.find({ meeting: id }).populate(
        "employee",
        "name email role designation"
      ),
      MeetingParticipant.countDocuments({ meeting: id, status: { $nin: ["left"] } }),
      MeetingParticipant.countDocuments({ meeting: id, status: "joined" }),
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        meeting: toClientMeeting(meeting),
        participants,
        totalInvited,
        joinedCount,
        presentCount: joinedCount,
        absentCount: Math.max(0, totalInvited - joinedCount),
      })
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getMeetingAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600000);

    const base = { company: req.companyId };
    const [total, live, upcoming, completed, cancelled, thisWeek, interviews, avgParticipants, totalParticipants, monthGroups, organizerGroups] =
      await Promise.all([
        Meeting.countDocuments(base),
        Meeting.countDocuments({ ...base, status: "live" }),
        Meeting.countDocuments({ ...base, status: "upcoming", start: { $gte: now } }),
        Meeting.countDocuments({ ...base, status: "completed" }),
        Meeting.countDocuments({ ...base, status: "cancelled" }),
        Meeting.countDocuments({ ...base, start: { $gte: weekAgo } }),
        Meeting.countDocuments({ ...base, candidate: { $ne: null } }),
        Meeting.aggregate([
          { $match: { company: req.companyId, status: "completed" } },
          { $group: { _id: null, avg: { $avg: "$liveParticipantCount" } } },
        ]),
        MeetingParticipant.countDocuments({ companyId: req.companyId }),
        Meeting.aggregate([
          {
            $match: {
              company: req.companyId,
              start: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
            },
          },
          { $group: { _id: { y: { $year: "$start" }, m: { $month: "$start" } }, count: { $sum: 1 } } },
        ]),
        Meeting.aggregate([
          { $match: { company: req.companyId, organizer: { $ne: null } } },
          { $group: { _id: "$organizer", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
      ]);

    const monthMap = {};
    for (const g of monthGroups) {
      monthMap[`${g._id.y}-${g._id.m}`] = g.count;
    }
    const byMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      byMonth.push({
        month: d.toLocaleString("en", { month: "short" }),
        count: monthMap[`${d.getFullYear()}-${d.getMonth() + 1}`] || 0,
      });
    }

    const organizerIds = organizerGroups.map((g) => g._id);
    const organizers = await Employee.find({ _id: { $in: organizerIds } })
      .select("name")
      .lean();
    const nameMap = {};
    for (const e of organizers) nameMap[String(e._id)] = e.name;
    const byEmployee = organizerGroups.map((g) => ({
      name: nameMap[String(g._id)] || "Unknown",
      count: g.count,
    }));

    return res.status(200).json(
      new ApiResponse(200, {
        total,
        live,
        upcoming,
        completed,
        cancelled,
        thisWeek,
        interviews,
        avgParticipants: Math.round(avgParticipants[0]?.avg || 0),
        totalParticipants,
        completionRate: total ? Math.round((completed / total) * 100) : 0,
        byMonth,
        byEmployee,
      })
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getInvitations = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid meeting ID"));
    }
    const data = await MeetingInvitation.find({ meeting: id }).sort({
      createdAt: -1,
    });
    return res.status(200).json(new ApiResponse(200, data, "Invitations fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getMeetingChannel = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid meeting ID"));
    }
    const channel = await MeetingChannel.findOne({ meeting: id }).populate(
      "members",
      "name email role profileImg"
    );
    if (!channel) return res.status(404).json(new ApiError(404, "Channel not found"));
    return res.status(200).json(new ApiResponse(200, channel, "Channel fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const listForDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday.getTime() + 24 * 3600000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600000);

    const canSeeAll = isHR(req);
    const base = { company: req.companyId };
    if (!canSeeAll) {
      base.$or = [{ organizer: req.user.id }, { interviewers: req.user.id }];
    }

    const [upcoming, today, recent, completed, missed, interviews, live] =
      await Promise.all([
        Meeting.find({ ...base, status: "upcoming", start: { $gte: now } })
          .populate("organizer", "name email role profileImg")
          .sort({ start: 1 })
          .limit(8),
        Meeting.find({ ...base, status: { $in: ["upcoming", "live"] }, start: { $gte: startOfToday, $lt: endOfToday } })
          .populate("organizer", "name email role profileImg")
          .sort({ start: 1 })
          .limit(8),
        Meeting.find({ ...base, status: { $in: ["completed", "live"] }, end: { $gte: weekAgo } })
          .populate("organizer", "name email role profileImg")
          .sort({ start: -1 })
          .limit(8),
        Meeting.find({ ...base, status: "completed" })
          .populate("organizer", "name email role profileImg")
          .sort({ start: -1 })
          .limit(8),
        Meeting.find({ ...base, status: "completed", missedReason: { $ne: "" } })
          .populate("organizer", "name email role profileImg")
          .sort({ start: -1 })
          .limit(8),
        Meeting.find({ ...base, candidate: { $ne: null } })
          .populate("organizer", "name email role profileImg")
          .populate("candidate", "firstName lastName email")
          .sort({ start: -1 })
          .limit(8),
        Meeting.find({ ...base, status: "live" })
          .populate("organizer", "name email role profileImg")
          .sort({ start: -1 })
          .limit(8),
      ]);

    return res.status(200).json(
      new ApiResponse(200, {
        upcoming: upcoming.map(toClientMeeting),
        today: today.map(toClientMeeting),
        recent: recent.map(toClientMeeting),
        completed: completed.map(toClientMeeting),
        missed: missed.map(toClientMeeting),
        interviews: interviews.map(toClientMeeting),
        live: live.map(toClientMeeting),
      })
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
