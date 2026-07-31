import Event from "../model/Evemt.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { isValidObjectId } from "../utils/validation.js";
import { logActivity } from "../utils/activityLogger.js";

export const PostEvent = async (req, res) => {
  const { taskTitle, title, desc, StartDate, EndDate } = req.body;
  if ([taskTitle, title, desc].some((f) => !f || f.trim() === "")) {
    return res.status(400).json(new ApiError(400, "All fields are required"));
  }
  try {
    const data = await Event.create({
      taskTitle,
      title,
      desc,
      StartDate,
      EndDate,
      companyId: req.companyId,
    });

    await logActivity({
      companyId: req.companyId,
      actor: req.user.id,
      action: "event.created",
      module: "event",
      targetType: "Event",
      targetId: data._id,
      details: `Created event "${title}"`,
      ip: req.ip,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, data, "Event created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const GetEvent = async (req, res) => {
  try {
    const filter = req.companyId ? { companyId: req.companyId } : {};
    const data = await Event.find(filter).sort({ createdAt: -1 });
    return res
      .status(200)
      .json(new ApiResponse(200, data, "Events fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const GetOneEvent = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json(new ApiError(400, "Invalid event ID"));
  }
  try {
    const filter = { _id: id };
    if (req.companyId) filter.companyId = req.companyId;
    const data = await Event.findOne(filter);
    if (!data) {
      return res.status(404).json(new ApiError(404, "Event not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, data, "Event fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateEvent = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json(new ApiError(400, "Invalid event ID"));
  }
  const { taskTitle, title, desc, StartDate, EndDate } = req.body;
  try {
    const filter = { _id: id };
    if (req.companyId) filter.companyId = req.companyId;
    const data = await Event.findOneAndUpdate(
      filter,
      { taskTitle, title, desc, StartDate, EndDate },
      { new: true }
    );
    if (!data) {
      return res.status(404).json(new ApiError(404, "Event not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, data, "Event updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const DeleteEvent = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json(new ApiError(400, "Invalid event ID"));
  }
  try {
    const filter = { _id: id };
    if (req.companyId) filter.companyId = req.companyId;
    const data = await Event.findOneAndDelete(filter);
    if (!data) {
      return res.status(404).json(new ApiError(404, "Event not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, data, "Event deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
