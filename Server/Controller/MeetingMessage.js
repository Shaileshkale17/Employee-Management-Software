import { MeetingMessage } from "../model/MeetingMessage.model.js";
import { MeetingChannel } from "../model/Channel.model.js";
import Meeting from "../model/Meeting.model.js";
import { Employee } from "../model/Employee.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { isValidObjectId } from "../utils/validation.js";
import { logActivity } from "../utils/activityLogger.js";

const HR_ROLES = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"];

const findMeeting = (targetId, companyId) => {
  const query = isValidObjectId(targetId) ? { _id: targetId } : { meetingId: targetId };
  if (companyId) query.company = companyId;
  return Meeting.findOne(query);
};

const canAccessMeeting = async (req, meeting) => {
  if (req.guest) {
    return (
      String(meeting.meetingId) === String(req.guest.meetingId) ||
      String(meeting._id) === String(req.guest.meetingId)
    );
  }
  if (HR_ROLES.includes(req.employee?.role || req.user?.role)) return true;
  const isOrganizer = String(meeting.organizer?._id || meeting.organizer) === String(req.user.id);
  const isInterviewer = (meeting.interviewers || []).some(
    (p) => String(p?._id || p) === String(req.user.id)
  );
  return isOrganizer || isInterviewer;
};

export const sendMessage = async (req, res) => {
  try {
    const { meetingId, id } = req.params;
    const targetId = id || meetingId;
    const meeting = await findMeeting(targetId, req.companyId);
    if (!meeting) return res.status(404).json(new ApiError(404, "Meeting not found"));
    if (!(await canAccessMeeting(req, meeting))) {
      return res.status(403).json(new ApiError(403, "You are not part of this meeting"));
    }

    const { text = "", replyTo = null, mentions = [] } = req.body || {};
    if (!String(text).trim() && !(req.files || []).length) {
      return res.status(400).json(new ApiError(400, "Message text or attachment is required"));
    }

    const files = (req.files || []).map((f) => ({
      name: f.originalname || f.filename,
      url: `/uploads/${f.filename}`,
      size: f.size || 0,
      type: f.mimetype || "",
    }));

    const message = await MeetingMessage.create({
      companyId: meeting.company,
      meeting: meeting._id,
      channel: meeting.channelId || null,
      sender: req.guest ? null : req.user.id,
      senderName: req.guest
        ? req.guest.name || req.guest.email || "Guest"
        : req.employee?.name || "",
      senderEmail: req.guest ? req.guest.email || "" : req.employee?.email || "",
      senderType: req.guest ? "guest" : "employee",
      text: String(text).trim(),
      attachments: files,
      mentions: Array.isArray(mentions)
        ? mentions.filter((m) => isValidObjectId(m))
        : [],
      replyTo: isValidObjectId(replyTo) ? replyTo : null,
    });

    const populated = await message.populate("replyTo", "text sender senderName attachments");

    if (req.io) {
      req.io.to(`meeting:${meeting.meetingId}`).emit("meeting:chat", populated.toObject());
      req.io.to(`meeting:${String(meeting._id)}`).emit("meeting:chat", populated.toObject());
    }

    if (meeting.channelId) {
      await MeetingChannel.updateOne(
        { _id: meeting.channelId },
        { $inc: { messagesCount: 1 } },
        { upsert: true }
      );
    }

    return res.status(201).json(new ApiResponse(201, populated, "Message sent"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getMessages = async (req, res) => {
  try {
    const { meetingId, id } = req.params;
    const targetId = id || meetingId;
    const meeting = await findMeeting(targetId, req.companyId);
    if (!meeting) return res.status(404).json(new ApiError(404, "Meeting not found"));
    if (!(await canAccessMeeting(req, meeting))) {
      return res.status(403).json(new ApiError(403, "You are not part of this meeting"));
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 50));

    const [data, total] = await Promise.all([
      MeetingMessage.find({ meeting: meeting._id })
        .populate("sender", "name email profileImg role")
        .populate("replyTo", "text sender senderName attachments createdAt")
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      MeetingMessage.countDocuments({ meeting: meeting._id }),
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        data,
        total,
        page,
        limit,
        hasMore: page * limit < total,
      })
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!isValidObjectId(messageId)) {
      return res.status(400).json(new ApiError(400, "Invalid message ID"));
    }
    const { emoji } = req.body || {};
    if (!emoji) return res.status(400).json(new ApiError(400, "Emoji is required"));

    const message = await MeetingMessage.findById(messageId);
    if (!message) return res.status(404).json(new ApiError(404, "Message not found"));

    const userId = req.guest ? `guest:${req.guest.sessionId}` : String(req.user.id);
    const userType = req.guest ? "guest" : "employee";
    const existing = (message.reactions || []).find(
      (r) => r.emoji === emoji && String(r.userId) === userId
    );
    if (existing) {
      message.reactions = (message.reactions || []).filter(
        (r) => !(r.emoji === emoji && String(r.userId) === userId)
      );
    } else {
      message.reactions = [
        ...(message.reactions || []),
        { emoji, userId, userType },
      ];
    }
    await message.save();

    const meeting = await Meeting.findById(message.meeting).select("meetingId");
    if (req.io && meeting) {
      req.io.to(`meeting:${meeting.meetingId}`).emit("meeting:chat:reacted", {
        messageId: message._id,
        reactions: message.reactions,
      });
    }
    return res.status(200).json(new ApiResponse(200, message, "Reaction updated"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!isValidObjectId(messageId)) {
      return res.status(400).json(new ApiError(400, "Invalid message ID"));
    }
    const message = await MeetingMessage.findById(messageId);
    if (!message) return res.status(404).json(new ApiError(404, "Message not found"));
    const isOwner = req.guest
      ? message.senderType === "guest" && String(message.senderEmail) === String(req.guest.email)
      : String(message.sender?._id || message.sender) === String(req.user.id);
    if (!isOwner) {
      return res.status(403).json(new ApiError(403, "You can only delete your own messages"));
    }
    await message.deleteOne();
    const meeting = await Meeting.findById(message.meeting).select("meetingId");
    if (req.io && meeting) {
      req.io.to(`meeting:${meeting.meetingId}`).emit("meeting:chat:deleted", {
        messageId: message._id,
      });
    }
    return res.status(200).json(new ApiResponse(200, null, "Message deleted"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId)) {
      return res.status(400).json(new ApiError(400, "Invalid channel ID"));
    }
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 50));
    const [data, total] = await Promise.all([
      MeetingMessage.find({ channel: channelId })
        .populate("sender", "name email profileImg role")
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      MeetingMessage.countDocuments({ channel: channelId }),
    ]);
    return res.status(200).json(
      new ApiResponse(200, { data, total, page, limit, hasMore: page * limit < total })
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const searchMessages = async (req, res) => {
  try {
    const { meetingId, q = "" } = req.query;
    if (!q.trim()) return res.status(200).json(new ApiResponse(200, []));
    const meeting = await findMeeting(meetingId, req.companyId);
    if (!meeting) return res.status(404).json(new ApiError(404, "Meeting not found"));
    if (!(await canAccessMeeting(req, meeting))) {
      return res.status(403).json(new ApiError(403, "You are not part of this meeting"));
    }
    const data = await MeetingMessage.find({
      meeting: meeting._id,
      text: { $regex: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
    })
      .populate("sender", "name email profileImg")
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json(new ApiResponse(200, data, "Search results"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const logMeetingMessageActivity = async (req, meeting, action, details) =>
  logActivity({
    companyId: meeting.company,
    actor: req.user.id,
    action,
    module: "meeting-message",
    targetType: "MeetingMessage",
    targetId: meeting._id,
    details,
    ip: req.ip,
  });
