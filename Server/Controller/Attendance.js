import { Attendance } from "../model/Attendance.model.js";
import { Employee } from "../model/Employee.model.js";
import { Company } from "../model/Company.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { notify } from "../utils/notificationService.js";
import { isValidObjectId } from "../utils/validation.js";
import { logActivity } from "../utils/activityLogger.js";
import { sendAttendanceEmail, sendAdminNotificationEmail, escapeHtml } from "../utils/mailService.js";
import {
  signAttendanceQrToken,
  verifyAttendanceQrToken,
} from "../utils/attendanceQr.js";

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

const WORK_START_MINUTES = 9 * 60; // 09:00
const WORK_END_MINUTES = 18 * 60; // 18:00

const toDayMinutes = (date) => {
  const d = new Date(date);
  return d.getHours() * 60 + d.getMinutes();
};

/**
 * Recomputes derived work fields on a loaded attendance record.
 * totalMinutes excludes break time; late/early/overtime are computed against a
 * fixed 09:00-18:00 schedule. Open breaks only count when the user is still
 * clocked in.
 */
const finalizeWork = (record) => {
  if (!record?.checkIn) return;
  const now = record.checkOut || new Date();
  const totalMs = Math.max(0, now - record.checkIn);

  const completed = (record.breaks || []).filter((b) => b?.start && b?.end);
  const open = (record.breaks || []).find((b) => b?.start && !b?.end);
  let breakMs = completed.reduce(
    (sum, b) => sum + Math.max(0, new Date(b.end) - new Date(b.start)),
    0
  );
  if (open && !record.checkOut) {
    breakMs += Math.max(0, now - new Date(open.start));
  }

  const breakMinutes = Math.round(breakMs / 60000);
  const totalMinutes = Math.max(0, Math.round((totalMs - breakMs) / 60000));
  const checkInMin = toDayMinutes(record.checkIn);
  const checkOutMin = record.checkOut ? toDayMinutes(record.checkOut) : null;
  const lateMinutes = Math.max(0, checkInMin - WORK_START_MINUTES);
  const earlyExitMinutes = record.checkOut ? Math.max(0, WORK_END_MINUTES - checkOutMin) : 0;
  const overtimeMinutes = record.checkOut ? Math.max(0, checkOutMin - WORK_END_MINUTES) : 0;

  record.totalMinutes = totalMinutes;
  record.breakMinutes = breakMinutes;
  record.lateMinutes = lateMinutes;
  record.earlyExitMinutes = earlyExitMinutes;
  record.overtimeMinutes = overtimeMinutes;
  record.isLate = lateMinutes > 0;
  record.isEarlyExit = earlyExitMinutes > 0;
};

export const clockIn = async (req, res) => {
  try {
    const today = startOfDay();
    const now = new Date();

    const existing = await Attendance.findOne({ employeeId: req.user.id, date: today });
    if (existing?.checkIn && !existing?.checkOut) {
      return res.status(400).json(new ApiError(400, "You have already clocked in today"));
    }
    if (existing?.checkIn && existing?.checkOut) {
      return res.status(400).json(new ApiError(400, "You have already clocked out today"));
    }

    const lateMinutes = Math.max(0, toDayMinutes(now) - WORK_START_MINUTES);
    const derived = {
      totalMinutes: 0,
      breakMinutes: 0,
      overtimeMinutes: 0,
      lateMinutes,
      earlyExitMinutes: 0,
      isLate: lateMinutes > 0,
      isEarlyExit: false,
    };

    let data;
    try {
      data = await Attendance.findOneAndUpdate(
        { employeeId: req.user.id, date: today, checkIn: null },
        {
          $set: { checkIn: now, online: true, status: "Present", ...derived },
          $setOnInsert: {
            breaks: [],
            approvalStatus: "approved",
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      // Unique index race: another concurrent clock-in created the record first.
      if (err?.code === 11000) {
        const dup = await Attendance.findOne({ employeeId: req.user.id, date: today });
        if (dup?.checkIn && !dup?.checkOut) {
          return res.status(400).json(new ApiError(400, "You have already clocked in today"));
        }
        data = await Attendance.findByIdAndUpdate(
          dup?._id,
          { checkIn: dup?.checkIn || now, online: true, status: "Present", ...derived },
          { new: true }
        );
      } else {
        throw err;
      }
    }

    if (!data?.checkIn) {
      return res.status(400).json(new ApiError(400, "You have already clocked in today"));
    }

    if (data.isLate && data.lateMinutes > 0) {
      notify({
        io: req.io,
        recipient: req.user.id,
        companyId: req.companyId,
        title: "Late Clock-In",
        message: `You clocked in ${data.lateMinutes} minute(s) late today (09:00 start).`,
        type: "attendance",
        link: "/attendance-info",
      });

      (async () => {
        try {
          const emp = await Employee.findById(req.user.id).select("name email").lean();
          if (emp?.email) {
            await sendAttendanceEmail({
              to: emp.email,
              name: emp.name,
              type: "late",
              data: { lateMinutes: data.lateMinutes },
            });
          }
        } catch (err) {
          console.error("Late clock-in email failed:", err.message);
        }
      })();
    }

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
    const openBreak = (existing.breaks || []).find((b) => b?.start && !b?.end);
    if (openBreak) openBreak.end = existing.checkOut;
    existing.checkHoldIn = null;
    existing.checkHoldOut = null;
    finalizeWork(existing);
    await existing.save();

    if (existing.overtimeMinutes > 0) {
      notify({
        io: req.io,
        recipient: req.user.id,
        companyId: req.companyId,
        title: "Overtime Recorded",
        message: `You worked ${existing.overtimeMinutes} minute(s) of overtime today.`,
        type: "attendance",
        link: "/attendance-info",
      });
    }

    (async () => {
      try {
        const emp = await Employee.findById(req.user.id).select("name email").lean();
        if (emp?.email) {
          await sendAttendanceEmail({
            to: emp.email,
            name: emp.name,
            type: "confirm",
            data: {
              date: today,
              checkIn: existing.checkIn,
              checkOut: existing.checkOut,
              totalMinutes: existing.totalMinutes,
              overtimeMinutes: existing.overtimeMinutes,
            },
          });
        }
      } catch (err) {
        console.error("Attendance confirmation email failed:", err.message);
      }
    })();

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

    const openBreak = (record.breaks || []).find((b) => b?.start && !b?.end);
    if (openBreak) {
      openBreak.end = new Date();
      record.checkHoldIn = null;
      record.checkHoldOut = null;
      finalizeWork(record);
      await record.save();
      return res.status(200).json(new ApiResponse(200, record, "Break ended"));
    }

    const start = new Date();
    record.breaks = [...(record.breaks || []), { start }];
    record.checkHoldIn = start;
    record.checkHoldOut = null;
    await record.save();

    return res.status(200).json(new ApiResponse(200, record, "Break started"));
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

/**
 * Issues the rotating QR for a Smart Check-In terminal. The token only proves
 * the terminal is official; whoever scans it is still clocked in/out with their
 * own authenticated session, so a scan can never record time for someone else.
 */
export const generateQrSession = async (req, res) => {
  try {
    const company = await Company.findById(req.companyId).select("name").lean();
    const label = company?.name || "Office Terminal";
    const token = signAttendanceQrToken({
      companyId: String(req.companyId),
      label,
    });
    return res.status(200).json(
      new ApiResponse(
        200,
        { token, label, expiresIn: 90 },
        "QR session generated"
      )
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const validateQrSession = async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token || typeof token !== "string") {
      return res.status(400).json(new ApiError(400, "Token is required"));
    }
    const decoded = verifyAttendanceQrToken(token);
    if (!decoded) {
      return res.status(400).json(
        new ApiError(
          400,
          "This QR code is invalid or has expired. Please rescan a fresh code."
        )
      );
    }
    if (decoded.companyId && String(decoded.companyId) !== String(req.companyId)) {
      return res
        .status(403)
        .json(new ApiError(403, "This QR code belongs to another company"));
    }
    return res.status(200).json(
      new ApiResponse(
        200,
        { valid: true, label: decoded.label || "Office Terminal" },
        "QR session valid"
      )
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

    // Base employee scope: restrict to employees in the caller's company (Super Admin sees all).
    const employeeScope = { ...(req.companyId ? { companyId: req.companyId } : {}) };
    if (department) employeeScope.department = department;
    if (employeeId) {
      if (!isValidObjectId(employeeId)) {
        return res.status(400).json(new ApiError(400, "Invalid employee ID"));
      }
      employeeScope._id = employeeId;
    }
    if (req.companyId || department || employeeId) {
      const employees = await Employee.find(employeeScope).select("_id");
      filter.employeeId = { $in: employees.map((e) => e._id) };
    }
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = startOfDay(from);
      if (to) filter.date.$lte = endOfDay(to);
    }
    if (status) filter.status = status;

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
    const allowed = [
      "checkIn",
      "checkOut",
      "checkHoldIn",
      "checkHoldOut",
      "breaks",
      "status",
      "date",
      "online",
      "approvalStatus",
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (update.status !== undefined && !["Present", "Absent", "Leave"].includes(update.status)) {
      return res.status(400).json(new ApiError(400, "Invalid status"));
    }
    if (
      update.approvalStatus !== undefined &&
      !["pending", "approved", "rejected"].includes(update.approvalStatus)
    ) {
      return res.status(400).json(new ApiError(400, "Invalid approval status"));
    }

    const existing = await Attendance.findById(id).select("employeeId");
    if (!existing) return res.status(404).json(new ApiError(404, "Attendance record not found"));
    if (req.companyId) {
      const owner = await Employee.findOne({ _id: existing.employeeId, companyId: req.companyId }).select("_id");
      if (!owner) return res.status(404).json(new ApiError(404, "Attendance record not found"));
    }

    const data = await Attendance.findByIdAndUpdate(id, update, { new: true });
    if (!data) return res.status(404).json(new ApiError(404, "Attendance record not found"));

    if (data.checkIn) {
      finalizeWork(data);
      await data.save();
    }

    await logActivity({
      companyId: req.companyId || data.companyId,
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
            checkIn: 1,
            checkOut: 1,
            breakMs: {
              $reduce: {
                input: { $ifNull: ["$breaks", []] },
                initialValue: 0,
                in: {
                  $add: [
                    "$$value",
                    {
                      $subtract: [
                        { $ifNull: ["$$this.end", new Date()] },
                        { $ifNull: ["$$this.start", new Date()] },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            hours: {
              $divide: [
                {
                  $max: [
                    0,
                    {
                      $subtract: [
                        { $subtract: [{ $ifNull: ["$checkOut", new Date()] }, "$checkIn"] },
                        "$breakMs",
                      ],
                    },
                  ],
                },
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

export const getAttendanceTodaySummary = async (req, res) => {
  try {
    const today = startOfDay();
    const scope = req.companyId
      ? { status: "Active", companyId: req.companyId }
      : { status: "Active" };
    const employees = await Employee.find(scope).select("_id");
    const ids = employees.map((e) => e._id);
    const records = await Attendance.find({
      employeeId: { $in: ids },
      date: today,
    });

    const present = records.filter((r) => r.checkIn && !r.checkOut).length;
    const clockedOut = records.filter((r) => r.checkIn && r.checkOut).length;
    const onBreak = records.filter((r) =>
      (r.breaks || []).some((b) => b?.start && !b?.end)
    ).length;
    const late = records.filter((r) => r.isLate).length;
    const overtime = records.filter((r) => (r.overtimeMinutes || 0) > 0).length;
    const absent = records.filter((r) => r.status === "Absent").length;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          date: today,
          total: ids.length,
          present,
          clockedOut,
          onBreak,
          late,
          overtime,
          absent,
          notMarked: Math.max(0, ids.length - records.length),
        },
        "Today attendance summary fetched"
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

/**
 * Creates "Absent" attendance records for active employees with no attendance
 * record today. Shared by the manual /auto-mark-absent endpoint and the daily
 * scheduler so both stay in sync.
 */
export const markEmployeesAbsent = async ({ companyId } = {}) => {
  const scope = companyId ? { status: "Active", companyId } : { status: "Active" };
  const employees = await Employee.find(scope).select("_id");
  const ids = employees.map((e) => e._id);
  const today = startOfDay();
  const existing = await Attendance.find({
    employeeId: { $in: ids },
    date: today,
  }).select("employeeId");
  const done = new Set(existing.map((r) => String(r.employeeId)));
  const missing = ids.filter((id) => !done.has(String(id)));

  if (missing.length) {
    await Attendance.bulkWrite(
      missing.map((id) => ({
        updateOne: {
          filter: { employeeId: id, date: today },
          update: {
            $setOnInsert: {
              employeeId: id,
              date: today,
              status: "Absent",
              breaks: [],
              totalMinutes: 0,
              breakMinutes: 0,
              overtimeMinutes: 0,
              lateMinutes: 0,
              earlyExitMinutes: 0,
              isLate: false,
              isEarlyExit: false,
              approvalStatus: "approved",
            },
          },
          upsert: true,
        },
      }))
    );

    // Notify absent employees and the admin (YOURSELF_EMAIL_ADDRESS) after the
    // cutoff time. Fire-and-forget so email failures never break the DB write.
    (async () => {
      try {
        const absentEmployees = await Employee.find({ _id: { $in: missing } })
          .select("name email")
          .lean();
        const withEmail = absentEmployees.filter((e) => e?.email);
        await Promise.allSettled(
          withEmail.map((e) =>
            sendAttendanceEmail({
              to: e.email,
              name: e.name,
              type: "absent",
            })
          )
        );
        if (withEmail.length) {
          const label = today.toDateString();
          const names = withEmail.slice(0, 10).map((e) => e.name).join(", ");
          await sendAdminNotificationEmail({
            subject: `Attendance report — ${label}`,
            text:
              `The following ${withEmail.length} employee(s) were marked absent on ${label} ` +
              `because no attendance was recorded before the cutoff time:\n\n${names}${withEmail.length > 10 ? "\n..." : ""}`,
            html: `<p style="color:#4b5563;">The following <strong>${withEmail.length}</strong> employee(s) were marked absent on <strong>${escapeHtml(label)}</strong> because no attendance was recorded before the cutoff time:</p><ul>${withEmail
              .slice(0, 10)
              .map((e) => `<li>${escapeHtml(e.name)}</li>`)
              .join("")}</ul>${withEmail.length > 10 ? `<p style="color:#9ca3af;">…and ${withEmail.length - 10} more.</p>` : ""}`,
          });
        }
      } catch (err) {
        console.error("Absent attendance email failed:", err.message);
      }
    })();
  }

  return { marked: missing.length };
};

export const autoMarkAbsent = async (req, res) => {
  try {
    const result = await markEmployeesAbsent({ companyId: req.companyId });
    return res.status(200).json(
      new ApiResponse(200, result, "Absent records created")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
