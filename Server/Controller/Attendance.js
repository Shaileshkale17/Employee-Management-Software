import { Attendance } from "../model/Attendance.model.js";
import { Employee } from "../model/Employee.model.js";
import { Notification } from "../model/Notification.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { isValidObjectId } from "../utils/validation.js";
import { logActivity } from "../utils/activityLogger.js";

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const clockIn = async (req, res) => {
  try {
    const today = startOfDay();
    const existing = await Attendance.findOne({
      employeeId: req.user.id,
      date: today,
    });

    if (existing && existing.checkIn && !existing.checkOut) {
      return res.status(400).json(new ApiError(400, "You have already clocked in today"));
    }

    const data =
      existing && !existing.checkIn
        ? await Attendance.findByIdAndUpdate(
            existing._id,
            { checkIn: new Date(), status: "Present", online: true },
            { new: true }
          )
        : await Attendance.create({
            employeeId: req.user.id,
            date: today,
            checkIn: new Date(),
            status: "Present",
            online: true,
          });

    return res.status(200).json(new ApiResponse(200, data, "Clocked in successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const clockOut = async (req, res) => {
  try {
    const today = startOfDay();
    const existing = await Attendance.findOne({
      employeeId: req.user.id,
      date: today,
    });

    if (!existing || !existing.checkIn) {
      return res.status(400).json(new ApiError(400, "You have not clocked in today"));
    }
    if (existing.checkOut) {
      return res.status(400).json(new ApiError(400, "You have already clocked out today"));
    }

    existing.checkOut = new Date();
    existing.online = false;
    existing.status = "Present";
    await existing.save();

    return res.status(200).json(new ApiResponse(200, existing, "Clocked out successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const toggleBreak = async (req, res) => {
  try {
    const today = startOfDay();
    const record = await Attendance.findOne({
      employeeId: req.user.id,
      date: today,
    });

    if (!record || !record.checkIn) {
      return res.status(400).json(new ApiError(400, "You have not clocked in today"));
    }
    if (record.checkOut) {
      return res.status(400).json(new ApiError(400, "You have already clocked out today"));
    }

    const isOnBreak = record.checkHoldIn && !record.checkHoldOut;
    if (isOnBreak) {
      record.checkHoldOut = new Date();
    } else {
      record.checkHoldIn = new Date();
      record.checkHoldOut = null;
    }
    await record.save();

    return res.status(200).json(
      new ApiResponse(200, record, isOnBreak ? "Break ended" : "Break started")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getTodayAttendance = async (req, res) => {
  try {
    const today = startOfDay();
    const data = await Attendance.findOne({
      employeeId: req.user.id,
      date: today,
    });
    return res.status(200).json(
      new ApiResponse(200, data || null, "Today's attendance fetched")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getMyAttendance = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 31 } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 31, 1), 100);
    const filter = { employeeId: req.user.id };

    if (month && year) {
      const m = Number(month);
      const y = Number(year);
      const from = new Date(Date.UTC(y, m - 1, 1));
      const to = new Date(Date.UTC(y, m, 1));
      filter.date = { $gte: from, $lt: to };
    }

    const [data, total] = await Promise.all([
      Attendance.find(filter).sort({ date: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Attendance.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, { data, total, page: pageNum, limit: limitNum }, "Attendance fetched")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getAllAttendance = async (req, res) => {
  try {
    const {
      from,
      to,
      department,
      status,
      employeeId,
      page = 1,
      limit = 50,
    } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const filter = {};

    if (req.companyId) {
      const employees = await Employee.find({ companyId: req.companyId }).select("_id");
      filter.employeeId = { $in: employees.map((e) => e._id) };
    }
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = startOfDay(from);
      if (to) filter.date.$lte = endOfDay(to);
    }
    if (status) filter.status = status;
    if (employeeId) {
      if (!isValidObjectId(employeeId)) {
        return res.status(400).json(new ApiError(400, "Invalid employee ID"));
      }
      filter.employeeId = employeeId;
    }
    if (department) {
      const employees = await Employee.find({ department }).select("_id");
      filter.employeeId = { $in: employees.map((e) => e._id) };
    }

    const [data, total] = await Promise.all([
      Attendance.find(filter)
        .populate("employeeId", "name email employeeId department designation")
        .sort({ date: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Attendance.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, { data, total, page: pageNum, limit: limitNum }, "Attendance records fetched")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid attendance ID"));
    }
    const allowed = ["checkIn", "checkOut", "checkHoldIn", "checkHoldOut", "status", "date", "online"];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (update.status !== undefined && !["Present", "Absent", "Leave"].includes(update.status)) {
      return res.status(400).json(new ApiError(400, "Invalid status"));
    }
    const data = await Attendance.findByIdAndUpdate(id, update, { new: true });
    if (!data) return res.status(404).json(new ApiError(404, "Attendance record not found"));

    await logActivity({
      companyId: req.companyId,
      actor: req.user.id,
      action: "attendance.updated",
      module: "attendance",
      targetType: "Attendance",
      targetId: data._id,
      ip: req.ip,
    });

    return res.status(200).json(new ApiResponse(200, data, "Attendance record updated"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getAttendanceSummary = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();
    const from = new Date(Date.UTC(y, m - 1, 1));
    const to = new Date(Date.UTC(y, m, 1));
    const filter = { date: { $gte: from, $lt: to } };

    if (employeeId) {
      if (!isValidObjectId(employeeId)) return res.status(400).json(new ApiError(400, "Invalid employee ID"));
      filter.employeeId = employeeId;
    } else {
      if (req.companyId) {
        const employees = await Employee.find({ companyId: req.companyId }).select("_id");
        filter.employeeId = { $in: employees.map((e) => e._id) };
      }
    }

    const [present, absent, leave, workingHours] = await Promise.all([
      Attendance.countDocuments({ ...filter, status: "Present" }),
      Attendance.countDocuments({ ...filter, status: "Absent" }),
      Attendance.countDocuments({ ...filter, status: "Leave" }),
      Attendance.aggregate([
        { $match: filter },
        {
          $project: {
            hours: {
              $divide: [
                { $subtract: [{ $ifNull: ["$checkOut", new Date()] }, "$checkIn"] },
                3600000,
              ],
            },
          },
        },
        { $group: { _id: null, total: { $sum: "$hours" } } },
      ]),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          month: m,
          year: y,
          present,
          absent,
          leave,
          totalHours: Math.round((workingHours[0]?.total || 0) * 100) / 100,
        },
        "Attendance summary fetched"
      )
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getAttendanceCalendar = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();
    const from = new Date(Date.UTC(y, m - 1, 1));
    const to = new Date(Date.UTC(y, m, 1));

    const records = await Attendance.find({
      employeeId: req.user.id,
      date: { $gte: from, $lt: to },
    }).sort({ date: 1 });

    const cal = {};
    for (const r of records) {
      const key = r.date.toISOString().slice(0, 10);
      cal[key] = {
        status: r.status,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        online: r.online,
      };
    }

    return res.status(200).json(new ApiResponse(200, cal, "Attendance calendar fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const autoMarkAbsent = async (req, res) => {
  try {
    const employees = await Employee.find({ status: "Active" }).select("_id");
    const ids = employees.map((e) => e._id);
    const today = startOfDay();
    const existing = await Attendance.find({
      employeeId: { $in: ids },
      date: today,
    }).select("employeeId");
    const done = new Set(existing.map((r) => String(r.employeeId)));
    const missing = ids.filter((id) => !done.has(String(id)));

    if (missing.length) {
      await Attendance.insertMany(
        missing.map((id) => ({ employeeId: id, date: today, status: "Absent" }))
      );
    }

    return res.status(200).json(
      new ApiResponse(200, { marked: missing.length }, "Absent records created")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
