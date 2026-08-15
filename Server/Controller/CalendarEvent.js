import CalendarEvent from "../model/CalendarEvent.model.js";
import Meeting from "../model/Meeting.model.js";
import { Employee } from "../model/Employee.model.js";
import Interview from "../model/Interview.model.js";
import Task from "../model/Task.model.js";
import CompanyEvent from "../model/Evemt.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { logActivity } from "../utils/activityLogger.js";
import { notify } from "../utils/notificationService.js";
import { isValidObjectId, isValidEmail } from "../utils/validation.js";
import {
  validateEventPayload,
  EVENT_STATUSES,
  detectMeetingPlatform,
  normalizeAttendees,
} from "../utils/calendarValidation.js";
import {
  getOccurrencesInRange,
  nextOccurrence,
  isSameDay,
  startOfDay,
  endOfDay,
  addDays,
  computeDurationMinutes,
  isRecurring,
} from "../utils/recurrence.js";
import {
  createOnlineMeetingForCalendar,
  cancelOnlineMeetingForCalendar,
  deleteOnlineMeetingForCalendar,
  toClientMeeting,
} from "./Meeting.js";
import {
  sendCalendarInviteEmail,
  sendCalendarUpdatedEmail,
  sendCalendarCancelledEmail,
} from "../utils/calendarInviteEmail.js";

const HR_ROLES = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"];

const isHR = (req) => HR_ROLES.includes(req.employee?.role || req.user?.role);

const PAGINATION_LIMIT = 200;

const pushHistory = (event, action, field, oldValue, newValue, actor) => {
  event.history = event.history || [];
  event.history.push({
    action,
    field,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
    actor: actor || event.organizer || null,
    at: new Date(),
  });
  if (event.history.length > 60) {
    event.history = event.history.slice(-60);
  }
};

const emitCalendar = (io, action, payload, recipients = []) => {
  if (!io) return;
  const ids = new Set(
    [payload?.organizer?._id || payload?.organizer, ...(payload?.participants || []).map((p) => p?._id || p)]
      .filter(Boolean)
      .map(String)
  );
  recipients.forEach((r) => ids.add(String(r)));
  ids.forEach((id) => {
    try {
      io.to(`user:${id}`).emit(action, payload);
    } catch (error) {
      console.error("Socket emit failed:", error.message);
    }
  });
  try {
    io.to(`company:${payload?.company}`).emit(action, payload);
  } catch (error) {
    console.error("Socket emit to company failed:", error.message);
  }
};

const notifyParticipants = async (req, event, { title, message, type = "info", link = "" }) => {
  const targets = new Set([
    ...(event.participants || []).map((p) => String(p?._id || p)),
    String(event.organizer?._id || event.organizer || req.user.id),
  ]);
  for (const id of targets) {
    if (String(id) === String(req.user.id)) continue;
    await notify({
      io: req.io,
      recipient: id,
      companyId: event.company || req.companyId,
      title,
      message,
      type,
      link,
    });
  }
};

const buildMasterFilter = (req, from, to) => {
  const base = { company: req.companyId };
  if (!isHR(req)) {
    base.$or = [
      { visibility: "company" },
      { organizer: req.user.id },
      { participants: req.user.id },
    ];
  }
  base.$or = base.$or || [];
  base.$or.push({
    $or: [
      { start: { $gte: from, $lte: to } },
      { start: { $lte: from }, end: { $gte: from } },
      { "recurrence.enabled": true },
    ],
  });
  return base;
};

const toLegacyEvent = (ev) => {
  const plain = { ...ev };
  plain.link = plain.meetingLink || plain.link || "";
  return plain;
};

const resolveAttendees = async (attendees, companyId) => {
  const list = normalizeAttendees(attendees);
  if (!list.length) return { attendees: [], participantIds: [] };
  const emails = list.map((a) => a.email);
  const employees = await Employee.find({
    companyId,
    email: { $in: emails },
  }).select("_id name email");
  const byEmail = {};
  employees.forEach((emp) => {
    byEmail[(emp.email || "").toLowerCase()] = emp;
  });
  const participantIds = [];
  const resolved = list.map((a) => {
    const emp = byEmail[a.email];
    if (emp) {
      participantIds.push(String(emp._id));
      return { email: a.email, name: a.name || emp.name || "", required: a.required };
    }
    return { email: a.email, name: a.name || "", required: a.required };
  });
  return { attendees: resolved, participantIds };
};

const attachOnlineMeeting = async (req, event) => {
  const meeting = await createOnlineMeetingForCalendar({
    companyId: req.companyId,
    organizerId: req.user.id,
    title: event.title,
    description: event.description,
    agenda: event.agenda,
    timezone: event.timezone,
    start: event.start,
    end: event.end,
    duration: event.end ? Math.max(30, Math.round((new Date(event.end) - new Date(event.start)) / 60000)) : undefined,
    calendarEventId: event._id,
  });
  const joinUrl = toClientMeeting(meeting).joinUrl;
  event.meeting = meeting._id;
  event.meetingId = meeting.meetingId;
  event.meetingLink = joinUrl;
  event.link = joinUrl;
  event.meetingPlatform = "microsoft-teams";
  event.isOnlineMeeting = true;
  event.sourceRef = "Meeting";
  event.sourceId = meeting._id;
  return event;
};

const updateLinkedMeeting = async (event, changed) => {
  if (!event.meeting) return null;
  const meeting = await Meeting.findById(event.meeting);
  if (!meeting) return null;
  const fields = {
    title: event.title,
    description: event.description,
    agenda: event.agenda,
    timezone: event.timezone,
    start: event.start,
    end: event.end,
    duration: event.end
      ? Math.max(30, Math.round((new Date(event.end) - new Date(event.start)) / 60000))
      : meeting.duration,
  };
  const picks = Object.keys(fields).filter((k) => changed && (changed[k] !== undefined || k === "title" || k === "start"));
  let touched = false;
  for (const key of picks) {
    if (String(meeting[key] ?? "") !== String(fields[key] ?? "")) {
      meeting[key] = fields[key];
      touched = true;
    }
  }
  if (touched) await meeting.save();
  return meeting;
};

const sendCalendarInvites = async (event, organizerName) => {
  if (!Array.isArray(event.attendees) || !event.attendees.length) return;
  const meetingUrl = event.meetingLink || "";
  for (const attendee of event.attendees) {
    await sendCalendarInviteEmail({
      to: attendee.email,
      name: attendee.name,
      event,
      organizerName,
      meetingUrl,
    }).catch(() => {});
  }
};

const sendCalendarUpdates = async (event, organizerName) => {
  if (!Array.isArray(event.attendees) || !event.attendees.length) return;
  const meetingUrl = event.meetingLink || "";
  for (const attendee of event.attendees) {
    await sendCalendarUpdatedEmail({
      to: attendee.email,
      name: attendee.name,
      event,
      organizerName,
      meetingUrl,
    }).catch(() => {});
  }
};

const sendCalendarCancellations = async (event, organizerName) => {
  if (!Array.isArray(event.attendees) || !event.attendees.length) return;
  for (const attendee of event.attendees) {
    await sendCalendarCancelledEmail({
      to: attendee.email,
      name: attendee.name,
      event,
      organizerName,
    }).catch(() => {});
  }
};

export const createEvent = async (req, res) => {
  try {
    const body = req.body || {};
    const legacy = {
      title: body.title,
      description: body.description,
      start: body.start,
      end: body.end,
      type: body.type || "meeting",
      meetingLink: body.meetingLink || body.link,
      participants: body.participants || [],
      attendees: body.attendees,
      teamsMeeting: body.teamsMeeting,
      isOnlineMeeting: body.isOnlineMeeting,
      interview: body.interview || null,
      meetingPlatform: body.meetingPlatform || detectMeetingPlatform(body.meetingLink || body.link),
      visibility: body.visibility,
      recurrence: body.recurrence,
      reminders: body.reminders,
      priority: body.priority,
      status: body.status,
      category: body.category,
      location: body.location,
      tags: body.tags,
      notes: body.notes,
      agenda: body.agenda,
      allDay: body.allDay,
      timezone: body.timezone,
      source: body.source || "manual",
      sourceId: body.sourceId || null,
    };

    const { ok, errors, data } = validateEventPayload(legacy);
    if (!ok) {
      return res.status(400).json(new ApiError(400, errors.join(". "), errors));
    }

    const company = req.companyId || (isValidObjectId(body.companyId) ? body.companyId : null);
    if (!company) {
      return res.status(400).json(new ApiError(400, "Company is required"));
    }

    const visibility =
      legacy.visibility === "company" && isHR(req) ? "company" : "private";

    const { attendees, participantIds } = await resolveAttendees(body.attendees, company);
    const wantsMeeting = Boolean(body.teamsMeeting || body.isOnlineMeeting);

    const event = await CalendarEvent.create({
      company,
      ...data,
      isOnlineMeeting: data.isOnlineMeeting || Boolean(data.meetingLink),
      participants: [...new Set([...data.participants, ...participantIds])],
      attendees: attendees.length ? attendees : undefined,
      visibility,
      organizer: req.user.id,
      source: legacy.source,
      sourceId: legacy.sourceId || null,
      sourceRef: legacy.sourceId ? (legacy.source === "interview" ? "Interview" : null) : null,
      interview: legacy.interview || null,
      link: data.meetingLink || "",
      history: [],
    });

    if (legacy.interview && isValidObjectId(legacy.interview)) {
      event.interview = legacy.interview;
    }

    if (wantsMeeting) {
      await attachOnlineMeeting(req, event);
    }
    pushHistory(event, "created", "", null, null, req.user.id);
    await event.save();

    const populated = await event.populate([
      { path: "organizer", select: "name email role profileImg" },
      { path: "participants", select: "name email role profileImg" },
    ]);

    emitCalendar(req.io, "calendar:event:created", populated.toObject(), [
      req.user.id,
      ...(populated.participants || []).map((p) => String(p._id)),
    ]);

    if (populated.participants?.length) {
      await notifyParticipants(req, populated, {
        title: `New ${populated.type}: ${populated.title}`,
        message: `${populated.organizer?.name || "Someone"} scheduled "${
          populated.title
        }" on ${new Date(populated.start).toLocaleString()}`,
        type: populated.type === "interview" ? "interview" : "system",
        link: `/calendar?event=${populated._id}`,
      });
    }

    await sendCalendarInvites(populated, populated.organizer?.name || req.employee?.name || "");

    await logActivity({
      companyId: company,
      actor: req.user.id,
      action: "calendar.created",
      module: "calendar",
      targetType: "CalendarEvent",
      targetId: event._id,
      details: `Created calendar event "${event.title}"`,
      ip: req.ip,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, toLegacyEvent(populated.toObject()), "Calendar event created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getEvents = async (req, res) => {
  try {
    const now = new Date();
    const from = req.query.from ? new Date(req.query.from) : startOfDay(now);
    const to = req.query.to ? new Date(req.query.to) : addDays(now, 31);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return res.status(400).json(new ApiError(400, "Invalid from/to date range"));
    }
    const search = (req.query.search || "").trim().toLowerCase();
    const category = (req.query.category || "").trim();
    const priority = (req.query.priority || "").trim();
    const status = (req.query.status || "").trim();
    const type = (req.query.type || "").trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(PAGINATION_LIMIT, parseInt(req.query.limit, 10) || 200));

    const fromD = startOfDay(from);
    const toD = endOfDay(to);

    const masters = await CalendarEvent.find(buildMasterFilter(req, fromD, toD))
      .populate("organizer participants", "name email role profileImg designation")
      .lean();

    let occurrences = getOccurrencesInRange(masters, fromD, toD);

    if (search) {
      occurrences = occurrences.filter((o) => {
        const organizerName = (o.organizer?.name || "").toLowerCase();
        const participantNames = (o.participants || []).map((p) => (p.name || "").toLowerCase()).join(" ");
        const attendeeText = (o.attendees || [])
          .map((a) => `${a.name || ""} ${a.email || ""}`.toLowerCase())
          .join(" ");
        return [
          o.title,
          o.description,
          o.location,
          o.notes,
          (o.tags || []).join(" "),
          organizerName,
          participantNames,
          attendeeText,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      });
    }
    if (category) {
      occurrences = occurrences.filter((o) => (o.category?.name || "").toLowerCase() === category.toLowerCase());
    }
    if (priority) {
      occurrences = occurrences.filter((o) => o.priority === priority);
    }
    if (status) {
      occurrences = occurrences.filter((o) => o.status === status);
    }
    if (type) {
      occurrences = occurrences.filter((o) => o.type === type);
    }

    const total = occurrences.length;
    const startIdx = (page - 1) * limit;
    const data = occurrences.slice(startIdx, startIdx + limit).map(toLegacyEvent);

    return res.status(200).json(
      new ApiResponse(200, {
        data,
        total,
        page,
        limit,
        hasMore: startIdx + limit < total,
      })
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid event ID"));
    }
    const filter = { _id: id };
    if (req.companyId) filter.company = req.companyId;
    const event = await CalendarEvent.findOne(filter)
      .populate("organizer participants", "name email role profileImg designation phone")
      .populate({
        path: "interview",
        select: "candidate job interviewDate round mode meetingLink status type panel",
        populate: [
          { path: "candidate", select: "firstName lastName email" },
          { path: "job", select: "title" },
          { path: "panel", select: "name email" },
        ],
      });
    if (!event) {
      return res.status(404).json(new ApiError(404, "Event not found"));
    }
    const next = nextOccurrence(event.toObject(), new Date());
    return res.status(200).json(
      new ApiResponse(200, {
        ...toLegacyEvent(event.toObject()),
        nextOccurrence: next ? next.start : null,
        durationMinutes: computeDurationMinutes(event.start, event.end),
        recurring: isRecurring(event),
      })
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getMyEvents = async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : startOfDay(new Date());
    const to = req.query.to ? new Date(req.query.to) : addDays(from, 31);
    const fromD = startOfDay(from);
    const toD = endOfDay(to);
    const masters = await CalendarEvent.find({
      company: req.companyId,
      $or: [{ organizer: req.user.id }, { participants: req.user.id }, { visibility: "company" }],
    })
      .populate("organizer participants", "name email role")
      .lean();
    const data = getOccurrencesInRange(masters, fromD, toD).map(toLegacyEvent);
    return res.status(200).json(new ApiResponse(200, data, "Calendar events fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();
    const fromD = startOfDay(now);
    const toD = endOfDay(addDays(now, 30));
    const filter = { company: req.companyId };
    if (!isHR(req)) {
      filter.$or = [{ visibility: "company" }, { organizer: req.user.id }, { participants: req.user.id }];
    }
    const masters = await CalendarEvent.find(filter)
      .populate("organizer participants", "name email role")
      .lean();
    const occurrences = getOccurrencesInRange(masters, fromD, toD)
      .filter((o) => o.status !== "Cancelled" && o.status !== "Completed")
      .slice(0, 50)
      .map(toLegacyEvent);
    return res.status(200).json(new ApiResponse(200, occurrences, "Upcoming events fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const FEED_COLORS = {
  meeting: "#3354F4",
  interview: "#7c3aed",
  event: "#0ea5e9",
  holiday: "#10b981",
  birthday: "#ec4899",
  deadline: "#ef4444",
  task: "#f59e0b",
  reminder: "#64748b",
  important: "#f97316",
};

const toFeedItem = (type, item, start, end = null) => {
  const s = new Date(start);
  const now = new Date();
  const startDay = startOfDay(s);
  const todayStart = startOfDay(now);
  const dayDiff = Math.round((startDay - todayStart) / (24 * 60 * 60 * 1000));
  return {
    key: `${type}-${item._id || item.id}-${s.getTime()}`,
    id: item._id || item.id || null,
    type,
    title: item.title || item.name || "Untitled",
    subtitle: item.subtitle || item.description || "",
    start: s,
    end: end ? new Date(end) : null,
    status: item.status || "Scheduled",
    priority: item.priority || "Medium",
    meetingLink: item.meetingLink || item.link || "",
    meetingPlatform: item.meetingPlatform || "",
    category: item.category || { name: "General", color: FEED_COLORS[type] },
    color: item.category?.color || FEED_COLORS[type],
    isToday: isSameDay(s, now),
    daysFromNow: dayDiff,
  };
};

export const getUpcomingPanel = async (req, res) => {
  try {
    const now = new Date();
    const fromD = startOfDay(now);
    const toD = endOfDay(addDays(now, 30));
    const windowEnd = addDays(now, 30);
    const isManager = isHR(req);

    const filter = { company: req.companyId };
    if (!isManager) {
      filter.$or = [{ visibility: "company" }, { organizer: req.user.id }, { participants: req.user.id }];
    }
    const masters = await CalendarEvent.find(filter)
      .populate("organizer participants", "name email role")
      .lean();
    const occurrences = getOccurrencesInRange(masters, fromD, toD).filter(
      (o) => o.status !== "Cancelled" && o.status !== "Completed"
    );

    const grouped = {
      meetings: [],
      interviews: [],
      events: [],
      holidays: [],
      birthdays: [],
      companyEvents: [],
      deadlines: [],
      tasks: [],
      reminders: [],
      importantDates: [],
    };

    occurrences.forEach((o) => {
      const feed = toFeedItem(o.type, o, o.start, o.end);
      if (o.type === "meeting") grouped.meetings.push(feed);
      else if (o.type === "interview") grouped.interviews.push(feed);
      else if (o.type === "event") grouped.events.push(feed);
      else if (o.type === "holiday") grouped.holidays.push(feed);
      else if (o.type === "deadline") grouped.deadlines.push(feed);
      else if (o.type === "task") grouped.tasks.push(feed);
      else if (o.type === "reminder") grouped.reminders.push(feed);
      else if (o.type === "important") grouped.importantDates.push(feed);
    });

    if (isManager) {
      const interviewFilter = {
        companyId: req.companyId,
        interviewDate: { $gte: fromD, $lte: toD },
        status: { $in: ["Scheduled", "Rescheduled"] },
      };
      const interviews = await Interview.find(interviewFilter)
        .populate("candidate", "firstName lastName email")
        .populate("job", "title")
        .lean()
        .catch(() => []);
      interviews.forEach((iv) => {
        const start = new Date(iv.interviewDate);
        const title = `Interview — ${iv.candidate?.firstName || ""} ${iv.candidate?.lastName || ""}`.trim();
        grouped.interviews.push(
          toFeedItem("interview", {
            _id: iv._id,
            title,
            subtitle: `${iv.round || "Round 1"} · ${iv.job?.title || "Job"} · ${iv.mode || ""}`,
            meetingLink: iv.meetingLink || "",
            meetingPlatform: detectMeetingPlatform(iv.meetingLink),
            status: iv.status,
          }, start, new Date(start.getTime() + (iv.duration || 60) * 60000))
        );
      });

      const taskFilter = {
        companyId: req.companyId,
        dueDate: { $gte: fromD, $lte: toD },
        status: { $nin: ["Done", "Cancelled"] },
      };
      const tasks = await Task.find(taskFilter)
        .populate("assignee", "name email")
        .lean()
        .catch(() => []);
      tasks.forEach((t) => {
        grouped.tasks.push(
          toFeedItem("task", {
            _id: t._id,
            title: t.title,
            subtitle: `${t.priority || "Medium"} priority${t.assignee?.name ? ` · ${t.assignee.name}` : ""}`,
            status: t.status,
            priority: t.priority,
          }, t.dueDate)
        );
      });

      const companyEvents = await CompanyEvent.find({
        companyId: req.companyId,
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
        .catch(() => []);
      companyEvents.forEach((ce) => {
        const parsed = parseEventDate(ce.StartDate);
        if (!parsed) return;
        if (parsed < fromD || parsed > toD) return;
        grouped.companyEvents.push(
          toFeedItem("event", {
            _id: ce._id,
            title: ce.title || ce.taskTitle,
            subtitle: ce.desc || "",
          }, parsed)
        );
      });
    }

    const employeeFilter = { dateOfBirth: { $exists: true, $ne: null } };
    if (req.companyId) employeeFilter.companyId = req.companyId;
    const employees = await Employee.find(employeeFilter)
      .select("name email dateOfBirth role profileImg")
      .lean()
      .catch(() => []);
    employees.forEach((emp) => {
      if (!emp.dateOfBirth) return;
      const dob = new Date(emp.dateOfBirth);
      if (Number.isNaN(dob.getTime())) return;
      const nextBirthday = nextBirthdayDate(dob, now);
      if (nextBirthday > toD) return;
      grouped.birthdays.push(
        toFeedItem("birthday", {
          _id: emp._id,
          title: emp.name,
          subtitle: `${emp.role || "Team member"}${emp.designation ? ` · ${emp.designation}` : ""}`,
        }, nextBirthday)
      );
    });

    const feed = Object.values(grouped)
      .flat()
      .filter(Boolean)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 60);

    return res.status(200).json(
      new ApiResponse(
        200,
        { ...grouped, feed, windowStart: fromD, windowEnd: toD },
        "Upcoming panel fetched successfully"
      )
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const parseEventDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d;
  const parts = String(value).split(/[/,\s]+/).filter(Boolean);
  if (parts.length >= 3) {
    const parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const nextBirthdayDate = (dob, now) => {
  const currentYear = now.getUTCFullYear();
  const thisYear = new Date(
    Date.UTC(currentYear, dob.getUTCMonth(), dob.getUTCDate(), 0, 0, 0)
  );
  if (thisYear < startOfDay(now)) {
    return new Date(Date.UTC(currentYear + 1, dob.getUTCMonth(), dob.getUTCDate(), 0, 0, 0));
  }
  return thisYear;
};

export const getOverview = async (req, res) => {
  try {
    const now = new Date();
    const fromD = startOfDay(now);
    const toD = endOfDay(now);

    const filter = { company: req.companyId };
    if (!isHR(req)) {
      filter.$or = [{ visibility: "company" }, { organizer: req.user.id }, { participants: req.user.id }];
    }
    const masters = await CalendarEvent.find(filter)
      .populate("organizer participants", "name email role profileImg")
      .lean();

    const todayOccurrences = getOccurrencesInRange(masters, fromD, toD).filter(
      (o) => o.status !== "Cancelled" && o.status !== "Completed"
    );

    const todayMeetings = todayOccurrences
      .filter((o) => o.type === "meeting" || o.type === "interview")
      .map(toLegacyEvent);

    const ongoing = todayOccurrences.find(
      (o) =>
        new Date(o.start) <= now &&
        (!o.end || new Date(o.end) >= now) &&
        (o.type === "meeting" || o.type === "interview")
    );

    const allOccurrences = getOccurrencesInRange(masters, startOfDay(now), endOfDay(addDays(now, 365)))
      .filter((o) => o.status !== "Cancelled" && o.status !== "Completed");

    const nextEvent =
      allOccurrences.find((o) => new Date(o.start) >= now && (o.type === "meeting" || o.type === "event" || o.type === "interview")) || null;
    const upcomingInterview =
      allOccurrences.find((o) => new Date(o.start) >= now && o.type === "interview") || null;

    const quickJoin = allOccurrences
      .filter(
        (o) =>
          o.meetingLink &&
          new Date(o.start) >= now &&
          new Date(o.start) <= new Date(now.getTime() + 2 * 60 * 60 * 1000)
      )
      .slice(0, 5)
      .map((o) => ({
        id: o._id,
        title: o.title,
        meetingLink: o.meetingLink,
        meetingPlatform: o.meetingPlatform,
        start: o.start,
      }));

    let upcomingDeadlines = [];
    if (isHR(req)) {
      upcomingDeadlines = await Task.find({
        companyId: req.companyId,
        dueDate: { $gte: fromD, $lte: endOfDay(addDays(now, 7)) },
        status: { $nin: ["Done", "Cancelled"] },
      })
        .populate("assignee", "name email")
        .lean()
        .catch(() => []);
    } else {
      upcomingDeadlines = await Task.find({
        assignee: req.user.id,
        dueDate: { $gte: fromD, $lte: endOfDay(addDays(now, 7)) },
        status: { $nin: ["Done", "Cancelled"] },
      })
        .lean()
        .catch(() => []);
    }

    return res.status(200).json(
      new ApiResponse(200, {
        todayMeetings,
        ongoingMeeting: ongoing ? toLegacyEvent(ongoing) : null,
        nextEvent: nextEvent ? toLegacyEvent(nextEvent) : null,
        upcomingInterview: upcomingInterview ? toLegacyEvent(upcomingInterview) : null,
        upcomingDeadlines,
        quickJoin,
      })
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid event ID"));
    }
    const filter = { _id: id };
    if (req.companyId) filter.company = req.companyId;
    const event = await CalendarEvent.findOne(filter);
    if (!event) {
      return res.status(404).json(new ApiError(404, "Event not found"));
    }

    const isOrganizer = String(event.organizer) === String(req.user.id);
    if (!isOrganizer && !isHR(req)) {
      return res.status(403).json(new ApiError(403, "You do not have permission to edit this event"));
    }

    const occurrenceStr = req.query.occurrence;
    if (occurrenceStr && isRecurring(event)) {
      const target = new Date(occurrenceStr);
      if (Number.isNaN(target.getTime())) {
        return res.status(400).json(new ApiError(400, "Invalid occurrence date"));
      }
      const { title, start, end, status } = req.body || {};
      let override = (event.overrides || []).find((o) => isSameDay(o.originalStart, target));
      const updates = {};
      if (title !== undefined) updates.title = String(title).trim();
      if (status !== undefined && EVENT_STATUSES.includes(status)) updates.status = status;
      if (start !== undefined) updates.start = new Date(start);
      if (end !== undefined) updates.end = new Date(end);
      if (Object.keys(updates).length === 0) {
        return res.status(400).json(new ApiError(400, "Nothing to update"));
      }
      if (override) {
        Object.assign(override, updates);
      } else {
        override = { originalStart: target, ...updates };
        event.overrides = [...(event.overrides || []), override];
      }
      pushHistory(event, "updated_occurrence", "occurrence", occurrenceStr, updates, req.user.id);
      await event.save();
      const populated = await event.populate("organizer participants", "name email role profileImg");
      emitCalendar(req.io, "calendar:event:updated", populated.toObject(), [req.user.id]);
      await logActivity({
        companyId: req.companyId,
        actor: req.user.id,
        action: "calendar.updated_occurrence",
        module: "calendar",
        targetType: "CalendarEvent",
        targetId: event._id,
        details: `Updated an occurrence of "${event.title}"`,
        ip: req.ip,
      });
      return res.status(200).json(new ApiResponse(200, populated.toObject(), "Occurrence updated successfully"));
    }

    const old = event.toObject();
    const body = req.body || {};
    const { ok, errors, data } = validateEventPayload({ ...old, ...body });
    if (!ok) {
      return res.status(400).json(new ApiError(400, errors.join(". "), errors));
    }

    if (data.visibility === "company" && !isHR(req)) {
      data.visibility = event.visibility;
    }
    if (data.meetingLink && data.meetingLink !== old.meetingLink) {
      data.meetingPlatform = data.meetingPlatform || detectMeetingPlatform(data.meetingLink);
    }

    let participantIds = [];
    if (body.attendees !== undefined) {
      const resolved = await resolveAttendees(body.attendees, req.companyId);
      data.attendees = resolved.attendees;
      participantIds = resolved.participantIds;
      data.participants = [...new Set([...(data.participants || []), ...participantIds])];
    }

    const changed = diffFields(old, data);
    Object.assign(event, data);

    const wantsMeeting =
      Boolean(body.teamsMeeting) ||
      (body.teamsMeeting === undefined && Boolean(event.meeting));
    if (wantsMeeting) {
      if (event.meeting) {
        await updateLinkedMeeting(event, changed);
        const linked = await Meeting.findById(event.meeting);
        const joinUrl = linked ? toClientMeeting(linked).joinUrl : "";
        if (joinUrl) {
          event.meetingLink = joinUrl;
          event.link = joinUrl;
        } else if (!event.meetingLink) {
          event.meetingLink = old.meetingLink || "";
        }
      } else {
        await attachOnlineMeeting(req, event);
      }
    } else if (body.teamsMeeting === false && event.meeting) {
      await cancelOnlineMeetingForCalendar({ meetingId: event.meeting });
      event.meeting = null;
      event.meetingId = "";
      event.sourceRef = null;
      event.sourceId = null;
      event.meetingLink = data.meetingLink || "";
      event.link = data.meetingLink || "";
      event.meetingPlatform = data.meetingPlatform || detectMeetingPlatform(data.meetingLink);
    }

    const becameCancelled = event.status === "Cancelled" && old.status !== "Cancelled";
    if (becameCancelled && event.meeting) {
      await cancelOnlineMeetingForCalendar({ meetingId: event.meeting });
    }
    event.isOnlineMeeting = Boolean(event.meeting || event.meetingLink);
    if (event.meeting) {
      event.meetingPlatform = "microsoft-teams";
    }

    pushHistory(event, "updated", "", changed, null, req.user.id);
    if (event.status === "Completed" && !event.completedAt) {
      event.completedAt = new Date();
    }
    await event.save();

    const populated = await event.populate([
      { path: "organizer", select: "name email role profileImg" },
      { path: "participants", select: "name email role profileImg" },
    ]);

    emitCalendar(req.io, "calendar:event:updated", populated.toObject(), [
      req.user.id,
      ...(populated.participants || []).map((p) => String(p._id)),
    ]);

    await notifyParticipants(req, populated, {
      title: `Updated: ${populated.title}`,
      message: `"${populated.title}" was updated by ${req.employee?.name || "your colleague"}`,
      type: "system",
      link: `/calendar?event=${populated._id}`,
    });

    const organizerName = populated.organizer?.name || req.employee?.name || "";
    if (becameCancelled) {
      await sendCalendarCancellations(populated, organizerName);
    } else if (
      populated.attendees?.length &&
      Object.keys(changed).some((k) =>
        ["title", "start", "end", "meetingLink", "location", "description", "timezone"].includes(k)
      )
    ) {
      await sendCalendarUpdates(populated, organizerName);
    }

    await logActivity({
      companyId: req.companyId,
      actor: req.user.id,
      action: "calendar.updated",
      module: "calendar",
      targetType: "CalendarEvent",
      targetId: event._id,
      details: `Updated calendar event "${event.title}"`,
      ip: req.ip,
    });

    return res.status(200).json(new ApiResponse(200, populated.toObject(), "Calendar event updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const diffFields = (oldDoc, newData) => {
  const tracked = [
    "title",
    "description",
    "start",
    "end",
    "allDay",
    "type",
    "priority",
    "status",
    "location",
    "meetingLink",
    "meetingPlatform",
    "visibility",
    "agenda",
    "notes",
    "participants",
    "recurrence",
    "reminders",
  ];
  const changes = {};
  for (const field of tracked) {
    const a = JSON.stringify(oldDoc[field]);
    const b = JSON.stringify(newData[field]);
    if (a !== b) changes[field] = { oldValue: oldDoc[field], newValue: newData[field] };
  }
  return changes;
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid event ID"));
    }
    const filter = { _id: id };
    if (req.companyId) filter.company = req.companyId;
    const event = await CalendarEvent.findOne(filter);
    if (!event) {
      return res.status(404).json(new ApiError(404, "Event not found"));
    }
    const isOrganizer = String(event.organizer) === String(req.user.id);
    if (!isOrganizer && !isHR(req)) {
      return res.status(403).json(new ApiError(403, "You do not have permission to delete this event"));
    }

    const occurrenceStr = req.query.occurrence;
    if (occurrenceStr && isRecurring(event)) {
      const target = new Date(occurrenceStr);
      if (Number.isNaN(target.getTime())) {
        return res.status(400).json(new ApiError(400, "Invalid occurrence date"));
      }
      const existing = (event.excludedDates || []).some((d) => isSameDay(d, target));
      if (!existing) {
        event.excludedDates = [...(event.excludedDates || []), startOfDay(target)];
        event.overrides = (event.overrides || []).filter((o) => !isSameDay(o.originalStart, target));
        pushHistory(event, "deleted_occurrence", "occurrence", occurrenceStr, null, req.user.id);
        await event.save();
      }
      const populated = await event.populate("organizer participants", "name email role profileImg");
      emitCalendar(req.io, "calendar:event:updated", populated.toObject(), [req.user.id]);
      return res.status(200).json(new ApiResponse(200, populated.toObject(), "Occurrence deleted successfully"));
    }

    const snapshot = event.toObject();
    if (event.meeting) {
      await deleteOnlineMeetingForCalendar({ meetingId: event.meeting });
    }
    await event.deleteOne();
    emitCalendar(req.io, "calendar:event:deleted", snapshot, [
      req.user.id,
      ...(snapshot.participants || []).map((p) => String(p?._id || p)),
    ]);
    await logActivity({
      companyId: req.companyId,
      actor: req.user.id,
      action: "calendar.deleted",
      module: "calendar",
      targetType: "CalendarEvent",
      targetId: id,
      details: `Deleted calendar event "${snapshot.title}"`,
      ip: req.ip,
    });
    return res.status(200).json(new ApiResponse(200, snapshot, "Calendar event deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const duplicateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid event ID"));
    }
    const filter = { _id: id };
    if (req.companyId) filter.company = req.companyId;
    const source = await CalendarEvent.findOne(filter).lean();
    if (!source) {
      return res.status(404).json(new ApiError(404, "Event not found"));
    }
    const baseStart = req.body?.start ? new Date(req.body.start) : addDays(new Date(source.start), 1);
    const duration = source.end ? new Date(source.end) - new Date(source.start) : 0;
    const reminders = (source.reminders || [])
      .map((r) => ({
        at: new Date(new Date(baseStart).getTime() - (r.minutesBefore || 0) * 60000),
        minutesBefore: r.minutesBefore || 0,
        sentAt: null,
      }))
      .filter((r) => Number.isFinite(r.minutesBefore) && r.minutesBefore >= 0);

    const hasLinkedMeeting = Boolean(source.meeting);
    const copy = await CalendarEvent.create({
      company: req.companyId || source.company,
      title: `${source.title} (Copy)`,
      description: source.description || "",
      start: baseStart,
      end: source.end ? new Date(baseStart.getTime() + duration) : null,
      allDay: source.allDay || false,
      timezone: source.timezone || "",
      type: source.type || "meeting",
      category: source.category || { name: "General", color: "#3354F4" },
      priority: source.priority || "Medium",
      status: "Scheduled",
      location: source.location || "",
      isOnlineMeeting: hasLinkedMeeting ? false : Boolean(source.isOnlineMeeting || source.meetingLink),
      meetingLink: hasLinkedMeeting ? "" : (source.meetingLink || ""),
      meetingPlatform: hasLinkedMeeting ? "" : (source.meetingPlatform || ""),
      attendees: source.attendees || [],
      tags: source.tags || [],
      notes: source.notes || "",
      agenda: source.agenda || "",
      organizer: req.user.id,
      participants: source.participants || [],
      visibility: source.visibility === "company" && isHR(req) ? "company" : "private",
      recurrence: source.recurrence || { enabled: false },
      excludedDates: [],
      overrides: [],
      reminders,
      history: [],
      source: source.source || "manual",
      interview: source.interview || null,
      link: source.meetingLink || "",
    });

    pushHistory(copy, "duplicated", "from", id, null, req.user.id);
    await copy.save();
    const populated = await copy.populate("organizer participants", "name email role profileImg");
    emitCalendar(req.io, "calendar:event:created", populated.toObject(), [req.user.id]);
    await logActivity({
      companyId: req.companyId,
      actor: req.user.id,
      action: "calendar.duplicated",
      module: "calendar",
      targetType: "CalendarEvent",
      targetId: copy._id,
      details: `Duplicated "${source.title}"`,
      ip: req.ip,
    });
    return res.status(201).json(new ApiResponse(201, populated.toObject(), "Event duplicated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid event ID"));
    }
    const { status } = req.body || {};
    if (!EVENT_STATUSES.includes(status)) {
      return res.status(400).json(new ApiError(400, "Invalid status"));
    }
    const filter = { _id: id };
    if (req.companyId) filter.company = req.companyId;
    const event = await CalendarEvent.findOne(filter);
    if (!event) {
      return res.status(404).json(new ApiError(404, "Event not found"));
    }
    const isOrganizer = String(event.organizer) === String(req.user.id);
    if (!isOrganizer && !isHR(req)) {
      return res.status(403).json(new ApiError(403, "You do not have permission to update this event"));
    }
    const oldStatus = event.status;
    event.status = status;
    if (status === "Completed" && !event.completedAt) event.completedAt = new Date();
    if (status !== "Completed") event.completedAt = null;

    if (status === "Cancelled" && oldStatus !== "Cancelled") {
      if (event.meeting) {
        await cancelOnlineMeetingForCalendar({ meetingId: event.meeting });
      }
      if (Array.isArray(event.attendees) && event.attendees.length) {
        event.attendees = event.attendees.map((a) => ({ ...a, status: "cancelled" }));
      }
      await event.save();
      const cancelled = await event.populate("organizer", "name email role profileImg");
      await sendCalendarCancellations(
        cancelled.toObject(),
        cancelled.organizer?.name || req.employee?.name || ""
      );
      await notifyParticipants(req, cancelled, {
        title: `Cancelled: ${cancelled.title}`,
        message: `"${cancelled.title}" was cancelled by ${req.employee?.name || "the organizer"}`,
        type: "system",
        link: `/calendar?event=${cancelled._id}`,
      });
    }

    pushHistory(event, "updated", "status", oldStatus, status, req.user.id);
    await event.save();
    const populated = await event.populate("organizer participants", "name email role profileImg");
    emitCalendar(req.io, "calendar:event:updated", populated.toObject(), [req.user.id]);
    return res.status(200).json(new ApiResponse(200, populated.toObject(), `Event marked ${status}`));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const snoozeEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid event ID"));
    }
    const minutes = Math.max(1, Math.min(1440, Number(req.body?.minutes) || 5));
    const filter = { _id: id };
    if (req.companyId) filter.company = req.companyId;
    const event = await CalendarEvent.findOne(filter);
    if (!event) {
      return res.status(404).json(new ApiError(404, "Event not found"));
    }
    event.reminders = event.reminders || [];
    event.reminders.push({
      at: new Date(Date.now() + minutes * 60000),
      minutesBefore: 0,
      sentAt: null,
    });
    event.snoozeUntil = new Date(Date.now() + minutes * 60000);
    pushHistory(event, "snoozed", "reminder", null, `+${minutes} minutes`, req.user.id);
    await event.save();
    return res.status(200).json(
      new ApiResponse(200, event.toObject(), `Reminder snoozed for ${minutes} minutes`)
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const uploadAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid event ID"));
    }
    const filter = { _id: id };
    if (req.companyId) filter.company = req.companyId;
    const event = await CalendarEvent.findOne(filter);
    if (!event) {
      return res.status(404).json(new ApiError(404, "Event not found"));
    }
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json(new ApiError(400, "No files uploaded"));
    }
    const attachments = files.map((f) => ({
      name: f.originalname || f.filename,
      url: f.url,
      size: f.size || 0,
    }));
    event.attachments = [...(event.attachments || []), ...attachments];
    pushHistory(event, "attachment_added", "attachments", null, attachments.length, req.user.id);
    await event.save();
    const populated = await event.populate("organizer participants", "name email role profileImg");
    emitCalendar(req.io, "calendar:event:updated", populated.toObject(), [req.user.id]);
    return res.status(200).json(new ApiResponse(200, populated.toObject(), "Attachments uploaded successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getEventsByInterview = async (req, res) => {
  try {
    const events = await CalendarEvent.find({
      company: req.companyId,
      type: "interview",
      interview: { $ne: null },
    })
      .populate("interview", "candidate job interviewDate round status")
      .sort({ start: -1 })
      .limit(30)
      .lean();
    return res.status(200).json(new ApiResponse(200, events, "Interview events fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
