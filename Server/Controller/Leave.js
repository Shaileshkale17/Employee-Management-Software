import { Leave } from "../model/LeaveSchema.model.js";
import { Employee } from "../model/Employee.model.js";
import { Notification } from "../model/Notification.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { sendLeaveStatusEmail } from "../utils/mailService.js";
import { isValidObjectId } from "../utils/validation.js";
import { logActivity } from "../utils/activityLogger.js";

const LEAVE_TYPES = ["Sick", "Casual", "Paid", "Unpaid"];

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysBetween = (a, b) => {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(Math.round(ms / 86400000) + 1, 1);
};

export const getBalance = async (employeeId) => {
  const employee = await Employee.findById(employeeId).select("Sick Casual Paid Unpaid");
  const used = await Leave.aggregate([
    { $match: { employeeId, status: "Approved" } },
    { $group: { _id: "$leaveType", days: { $sum: 1 } } },
  ]);
  const usedMap = {};
  for (const u of used) {
    const days = u._id ? daysBetween(u._id, u._id) : u.days;
    usedMap[u._id] = u.days;
  }
  const totals = {
    Sick: Number(employee?.Sick || 14),
    Casual: Number(employee?.Casual || 14),
    Paid: Number(employee?.Paid || 14),
    Unpaid: Number(employee?.Unpaid || 14),
  };
  const result = {};
  for (const type of LEAVE_TYPES) {
    result[type] = { total: totals[type], used: usedMap[type] || 0 };
    result[type].remaining = result[type].total - result[type].used;
  }
  return result;
};

export const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    if (!LEAVE_TYPES.includes(leaveType)) {
      return res.status(400).json(new ApiError(400, "Invalid leave type"));
    }
    if (!startDate || !endDate || !reason?.trim()) {
      return res.status(400).json(new ApiError(400, "All fields are required"));
    }
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json(new ApiError(400, "Start date cannot be after end date"));
    }
    if (new Date(startDate).getTime() < startOfDay().getTime()) {
      return res.status(400).json(new ApiError(400, "Cannot apply for past dates"));
    }

    const balance = await getBalance(req.user.id);
    const requested = daysBetween(startDate, endDate);
    if (balance[leaveType].remaining < requested) {
      return res.status(400).json(
        new ApiError(
          400,
          `Insufficient ${leaveType} leave balance. Available: ${balance[leaveType].remaining} day(s)`
        )
      );
    }

    const overlap = await Leave.findOne({
      employeeId: req.user.id,
      status: { $in: ["Pending", "Approved"] },
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
    });
    if (overlap) {
      return res.status(400).json(new ApiError(400, "Leave already exists for overlapping dates"));
    }

    const data = await Leave.create({
      employeeId: req.user.id,
      leaveType,
      startDate: startOfDay(startDate),
      endDate: startOfDay(endDate),
      reason: reason.trim(),
    });

    const employee = await Employee.findById(req.user.id).select("name email");
    if (employee) {
      const hr = await Employee.find({
        companyId: req.companyId,
        role: { $in: ["HR", "HR Manager", "Company Admin", "Super Admin"] },
      }).select("_id");
      if (hr.length) {
        await Notification.insertMany(
          hr.map((h) => ({
            companyId: req.companyId,
            recipient: h._id,
            recipientModel: "Employee",
            title: "New Leave Request",
            message: `${employee.name} requested ${requested} day(s) of ${leaveType} leave.`,
            type: "info",
            link: "/leaves",
          }))
        );
      }
    }

    await logActivity({
      companyId: req.companyId,
      actor: req.user.id,
      action: "leave.applied",
      module: "leave",
      targetType: "Leave",
      targetId: data._id,
      details: `${leaveType} leave from ${startDate} to ${endDate}`,
      ip: req.ip,
    });

    return res.status(201).json(new ApiResponse(201, data, "Leave request submitted"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const [data, total] = await Promise.all([
      Leave.find({ employeeId: req.user.id }).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Leave.countDocuments({ employeeId: req.user.id }),
    ]);
    return res.status(200).json(
      new ApiResponse(200, { data, total, page: pageNum, limit: limitNum }, "Leave requests fetched")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getLeaveBalance = async (req, res) => {
  try {
    const balance = await getBalance(req.user.id);
    return res.status(200).json(new ApiResponse(200, balance, "Leave balance fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getAllLeaves = async (req, res) => {
  try {
    const { status, leaveType, from, to, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const filter = {};
    if (req.companyId) {
      const employees = await Employee.find({ companyId: req.companyId }).select("_id");
      filter.employeeId = { $in: employees.map((e) => e._id) };
    }
    if (status) filter.status = status;
    if (leaveType) filter.leaveType = leaveType;
    if (from || to) {
      filter.startDate = {};
      if (from) filter.startDate.$gte = startOfDay(from);
      if (to) filter.startDate.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    const [data, total] = await Promise.all([
      Leave.find(filter)
        .populate("employeeId", "name email employeeId department designation")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Leave.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, { data, total, page: pageNum, limit: limitNum }, "Leave requests fetched")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!isValidObjectId(id)) return res.status(400).json(new ApiError(400, "Invalid leave ID"));
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json(new ApiError(400, "Invalid status"));
    }

    const leave = await Leave.findById(id).populate("employeeId", "name email companyId");
    if (!leave) return res.status(404).json(new ApiError(404, "Leave request not found"));
    if (req.companyId && String(leave.employeeId?.companyId) !== String(req.companyId)) {
      return res.status(403).json(new ApiError(403, "Not authorized"));
    }
    if (leave.status !== "Pending") {
      return res.status(400).json(new ApiError(400, "Leave request already reviewed"));
    }

    if (status === "Approved") {
      const balance = await getBalance(leave.employeeId._id);
      const requested = daysBetween(leave.startDate, leave.endDate);
      if (balance[leave.leaveType].remaining < requested) {
        return res.status(400).json(
          new ApiError(400, `Insufficient ${leave.leaveType} balance to approve this request`)
        );
      }
    }

    leave.status = status;
    leave.approvedBy = req.user.id;
    await leave.save();

    if (leave.employeeId?.email) {
      sendLeaveStatusEmail(
        leave.employeeId.email,
        leave.employeeId.name,
        leave.leaveType,
        status
      ).catch(() => {});
    }

    await Notification.create({
      companyId: req.companyId || leave.employeeId?.companyId,
      recipient: leave.employeeId._id,
      recipientModel: "Employee",
      title: "Leave Request Updated",
      message: `Your ${leave.leaveType} leave request was ${status}.`,
      type: "info",
      link: "/leaves",
    });

    await logActivity({
      companyId: req.companyId || leave.employeeId?.companyId,
      actor: req.user.id,
      action: status === "Approved" ? "leave.approved" : "leave.rejected",
      module: "leave",
      targetType: "Leave",
      targetId: leave._id,
      details: `${status} ${leave.leaveType} leave for ${leave.employeeId.name}`,
      ip: req.ip,
    });

    return res.status(200).json(new ApiResponse(200, leave, `Leave ${status.toLowerCase()}`));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getLeaveSummary = async (req, res) => {
  try {
    const { year } = req.query;
    const y = Number(year) || new Date().getFullYear();
    const from = new Date(Date.UTC(y, 0, 1));
    const to = new Date(Date.UTC(y + 1, 0, 1));
    const filter = { status: "Approved", startDate: { $gte: from, $lt: to } };
    if (req.companyId) {
      const employees = await Employee.find({ companyId: req.companyId }).select("_id");
      filter.employeeId = { $in: employees.map((e) => e._id) };
    }
    const data = await Leave.aggregate([
      { $match: filter },
      {
        $project: {
          leaveType: 1,
          days: {
            $add: [
              { $divide: [{ $subtract: ["$endDate", "$startDate"] }, 86400000] },
              1,
            ],
          },
        },
      },
      { $group: { _id: "$leaveType", days: { $sum: "$days" }, requests: { $sum: 1 } } },
    ]);
    return res.status(200).json(new ApiResponse(200, data, "Leave summary fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
