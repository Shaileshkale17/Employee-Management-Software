import { Notification } from "../model/Notification.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = {
      recipient: req.user.id,
      recipientModel: "Employee",
    };
    if (req.companyId) filter.companyId = req.companyId;

    const [data, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(Math.min(Number(limit) || 20, 100))
        .skip((Math.max(Number(page), 1) - 1) * (Number(limit) || 20)),
      Notification.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, { data, total, page: Number(page) || 1 }, "Notifications fetched successfully")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      recipientModel: "Employee",
      status: "Unread",
    });
    return res.status(200).json(new ApiResponse(200, { count }, "Unread count fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user.id },
      { status: "Read", readAt: new Date() },
      { new: true }
    );
    if (!data) return res.status(404).json(new ApiError(404, "Notification not found"));
    return res.status(200).json(new ApiResponse(200, data, "Notification marked as read"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, recipientModel: "Employee", status: "Unread" },
      { status: "Read", readAt: new Date() }
    );
    return res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Notification.findOneAndDelete({ _id: id, recipient: req.user.id });
    if (!data) return res.status(404).json(new ApiError(404, "Notification not found"));
    return res.status(200).json(new ApiResponse(200, data, "Notification deleted"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
