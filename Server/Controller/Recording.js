import { Recording } from "../model/Recording.model.js";
import Meeting from "../model/Meeting.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { isValidObjectId } from "../utils/validation.js";
import { logActivity } from "../utils/activityLogger.js";

export const getRecordings = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid meeting ID"));
    }
    const meeting = await Meeting.findOne({ _id: id, ...(req.companyId ? { company: req.companyId } : {}) }).select("_id");
    if (!meeting) return res.status(404).json(new ApiError(404, "Meeting not found"));
    const data = await Recording.find({ meeting: id }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, data, "Recordings fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const createRecording = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid meeting ID"));
    }
    const meeting = await Meeting.findOne({ _id: id, company: req.companyId });
    if (!meeting) return res.status(404).json(new ApiError(404, "Meeting not found"));

    const file = req.file;
    const data = await Recording.create({
      companyId: meeting.company,
      meeting: meeting._id,
      name: req.body?.name || `${meeting.title} recording`,
      url: file?.url || "",
      filename: file?.originalname || "",
      size: file?.size || 0,
      duration: Number(req.body?.duration) || 0,
      mimeType: file?.mimetype || "",
      status: req.body?.status || "processing",
      transcript: req.body?.transcript || "",
      summary: req.body?.summary || "",
      notes: req.body?.notes || "",
      createdBy: req.user.id,
    });

    await logActivity({
      companyId: meeting.company,
      actor: req.user.id,
      action: "recording.created",
      module: "meeting-recording",
      targetType: "Recording",
      targetId: data._id,
      details: `Recording added to "${meeting.title}"`,
      ip: req.ip,
    });

    return res.status(201).json(new ApiResponse(201, data, "Recording saved"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateRecording = async (req, res) => {
  try {
    const { recordingId } = req.params;
    if (!isValidObjectId(recordingId)) {
      return res.status(400).json(new ApiError(400, "Invalid recording ID"));
    }
    const allowed = ["name", "url", "duration", "status", "transcript", "summary", "notes", "actionItems"];
    const update = {};
    for (const key of allowed) {
      if (req.body?.[key] !== undefined) update[key] = req.body[key];
    }
    const data = await Recording.findOneAndUpdate(
      { _id: recordingId, ...(req.companyId ? { companyId: req.companyId } : {}) },
      update,
      { new: true }
    );
    if (!data) return res.status(404).json(new ApiError(404, "Recording not found"));
    return res.status(200).json(new ApiResponse(200, data, "Recording updated"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const deleteRecording = async (req, res) => {
  try {
    const { recordingId } = req.params;
    if (!isValidObjectId(recordingId)) {
      return res.status(400).json(new ApiError(400, "Invalid recording ID"));
    }
    const data = await Recording.findOneAndDelete({
      _id: recordingId,
      ...(req.companyId ? { companyId: req.companyId } : {}),
    });
    if (!data) return res.status(404).json(new ApiError(404, "Recording not found"));
    return res.status(200).json(new ApiResponse(200, data, "Recording deleted"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getMeetingNotes = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid meeting ID"));
    }
    const meeting = await Meeting.findOne({ _id: id, ...(req.companyId ? { company: req.companyId } : {}) }).select("_id");
    if (!meeting) return res.status(404).json(new ApiError(404, "Meeting not found"));
    const recording = await Recording.findOne({ meeting: id }).sort({ createdAt: -1 });
    const summary = recording?.summary || "";
    const transcript = recording?.transcript || "";
    const actionItems = recording?.actionItems || [];
    const notes = recording?.notes || "";
    return res.status(200).json(
      new ApiResponse(200, { summary, transcript, actionItems, notes, recordingId: recording?._id })
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const saveMeetingNotes = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid meeting ID"));
    }
    const meeting = await Meeting.findOne({ _id: id, ...(req.companyId ? { company: req.companyId } : {}) });
    if (!meeting) return res.status(404).json(new ApiError(404, "Meeting not found"));
    const { summary, transcript, actionItems, notes } = req.body || {};
    let recording = await Recording.findOne({ meeting: id }).sort({ createdAt: -1 });
    if (!recording) {
      recording = await Recording.create({
        companyId: meeting?.company || req.companyId,
        meeting: id,
        name: "Meeting notes",
        status: "ready",
        createdBy: req.user.id,
      });
    }
    if (summary !== undefined) recording.summary = summary;
    if (transcript !== undefined) recording.transcript = transcript;
    if (notes !== undefined) recording.notes = notes;
    if (actionItems !== undefined) recording.actionItems = Array.isArray(actionItems) ? actionItems : [];
    await recording.save();
    return res.status(200).json(new ApiResponse(200, recording, "Meeting notes saved"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
