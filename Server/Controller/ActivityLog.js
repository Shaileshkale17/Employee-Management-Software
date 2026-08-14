import { ActivityLog } from "../model/ActivityLog.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { isValidObjectId } from "../utils/validation.js";

export const getActivityLogs = async (req, res) => {
  try {
    const { module, actor, from, to, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const filter = {};
    if (req.companyId) filter.companyId = req.companyId;
    if (module) filter.module = module;
    if (actor) {
      if (!isValidObjectId(actor)) return res.status(400).json(new ApiError(400, "Invalid actor ID"));
      filter.actor = actor;
    }
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    const [data, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate("actor", "name email")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      ActivityLog.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, { data, total, page: pageNum, limit: limitNum }, "Activity logs fetched")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
