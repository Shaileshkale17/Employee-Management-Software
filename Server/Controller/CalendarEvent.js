import CalendarEvent from "../model/CalendarEvent.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createEvent = async (req, res) => {
  try {
    const { title, description, start, end, type, link, interview, attendees } = req.body;
    if (!title || !start) {
      return res.status(400).json(new ApiError(400, "Title and start time are required"));
    }
    const data = await CalendarEvent.create({
      company: req.companyId,
      title,
      description,
      start,
      end: end || null,
      type: type || "meeting",
      link: link || "",
      interview: interview || null,
      attendees: attendees || [],
      createdBy: req.user.id,
    });
    return res.status(201).json(new ApiResponse(201, data, "Calendar event created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getMyEvents = async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date(0);
    const to = req.query.to ? new Date(req.query.to) : new Date("2999-12-31");
    const data = await CalendarEvent.find({
      company: req.companyId,
      attendees: req.user.id,
      start: { $gte: from, $lte: to },
    })
      .populate("attendees", "name email role")
      .populate("interview")
      .sort({ start: 1 });
    return res.status(200).json(new ApiResponse(200, data, "Calendar events fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getUpcomingEvents = async (req, res) => {
  try {
    const data = await CalendarEvent.find({
      company: req.companyId,
      attendees: req.user.id,
      start: { $gte: new Date() },
    })
      .populate("attendees", "name email role")
      .populate("interview")
      .sort({ start: 1 })
      .limit(10);
    return res.status(200).json(new ApiResponse(200, data, "Upcoming events fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await CalendarEvent.findOneAndDelete({ _id: id, company: req.companyId });
    if (!data) return res.status(404).json(new ApiError(404, "Event not found"));
    return res.status(200).json(new ApiResponse(200, data, "Event deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
