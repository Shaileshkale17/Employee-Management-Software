import { Shift } from "../model/Shift.model.js";
import { Employee } from "../model/Employee.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { isValidObjectId } from "../utils/validation.js";
import { logActivity } from "../utils/activityLogger.js";

export const createShift = async (req, res) => {
  try {
    const { employeeId, shiftStart, shiftEnd } = req.body;
    if (!isValidObjectId(employeeId)) {
      return res.status(400).json(new ApiError(400, "Invalid employee ID"));
    }
    if (!shiftStart || !shiftEnd || new Date(shiftStart) >= new Date(shiftEnd)) {
      return res.status(400).json(new ApiError(400, "Invalid shift time range"));
    }
    const employee = await Employee.findOne({ _id: employeeId, companyId: req.companyId });
    if (!employee) return res.status(404).json(new ApiError(404, "Employee not found"));

    const data = await Shift.create({
      employeeId,
      shiftStart: new Date(shiftStart),
      shiftEnd: new Date(shiftEnd),
      assignedBy: req.user.id,
    });

    await logActivity({
      companyId: req.companyId,
      actor: req.user.id,
      action: "shift.created",
      module: "shift",
      targetType: "Shift",
      targetId: data._id,
      details: `Assigned shift to ${employee.name}`,
      ip: req.ip,
    });

    return res.status(201).json(new ApiResponse(201, data, "Shift created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getShifts = async (req, res) => {
  try {
    const { employeeId, from, to, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const filter = {};
    const employeeScope = { ...(req.companyId ? { companyId: req.companyId } : {}) };
    if (employeeId) {
      if (!isValidObjectId(employeeId)) return res.status(400).json(new ApiError(400, "Invalid employee ID"));
      employeeScope._id = employeeId;
    }
    if (req.companyId || employeeId) {
      const employees = await Employee.find(employeeScope).select("_id");
      filter.employeeId = { $in: employees.map((e) => e._id) };
    }
    if (from || to) {
      filter.shiftStart = {};
      if (from) filter.shiftStart.$gte = new Date(from);
      if (to) filter.shiftStart.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    const [data, total] = await Promise.all([
      Shift.find(filter)
        .populate("employeeId", "name email employeeId department designation")
        .populate("assignedBy", "name email")
        .sort({ shiftStart: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Shift.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, { data, total, page: pageNum, limit: limitNum }, "Shifts fetched")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getMyShifts = async (req, res) => {
  try {
    const data = await Shift.find({ employeeId: req.user.id }).sort({ shiftStart: -1 }).limit(50);
    return res.status(200).json(new ApiResponse(200, data, "Shifts fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateShiftStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!isValidObjectId(id)) return res.status(400).json(new ApiError(400, "Invalid shift ID"));
    if (!["Scheduled", "Completed", "Cancelled"].includes(status)) {
      return res.status(400).json(new ApiError(400, "Invalid status"));
    }
    const existing = await Shift.findById(id).select("employeeId");
    if (!existing) return res.status(404).json(new ApiError(404, "Shift not found"));
    if (req.companyId) {
      const owner = await Employee.findOne({ _id: existing.employeeId, companyId: req.companyId }).select("_id");
      if (!owner) return res.status(404).json(new ApiError(404, "Shift not found"));
    }
    const data = await Shift.findByIdAndUpdate(id, { status }, { new: true });
    if (!data) return res.status(404).json(new ApiError(404, "Shift not found"));
    return res.status(200).json(new ApiResponse(200, data, "Shift updated"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json(new ApiError(400, "Invalid shift ID"));
    const existing = await Shift.findById(id).select("employeeId");
    if (!existing) return res.status(404).json(new ApiError(404, "Shift not found"));
    if (req.companyId) {
      const owner = await Employee.findOne({ _id: existing.employeeId, companyId: req.companyId }).select("_id");
      if (!owner) return res.status(404).json(new ApiError(404, "Shift not found"));
    }
    const data = await Shift.findByIdAndDelete(id);
    if (!data) return res.status(404).json(new ApiError(404, "Shift not found"));
    return res.status(200).json(new ApiResponse(200, null, "Shift deleted"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
