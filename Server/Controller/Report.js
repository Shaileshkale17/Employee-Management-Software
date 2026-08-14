import { Attendance } from "../model/Attendance.model.js";
import { Employee } from "../model/Employee.model.js";
import { Leave } from "../model/LeaveSchema.model.js";
import CalendarEvent from "../model/CalendarEvent.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const monthRange = (month, year) => {
  const m = Number(month) || new Date().getMonth() + 1;
  const y = Number(year) || new Date().getFullYear();
  return {
    from: new Date(Date.UTC(y, m - 1, 1)),
    to: new Date(Date.UTC(y, m, 1)),
    m,
    y,
  };
};

const csv = (rows) =>
  rows
    .map((row) =>
      row
        .map((cell) => {
          const v = String(cell ?? "");
          return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        })
        .join(",")
    )
    .join("\r\n");

export const getEmployeeReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const { from, to, m, y } = monthRange(month, year);
    const filter = { date: { $gte: from, $lt: to } };
    if (req.companyId) {
      const employees = await Employee.find({ companyId: req.companyId }).select("_id");
      filter.employeeId = { $in: employees.map((e) => e._id) };
    }

    const [records, employees] = await Promise.all([
      Attendance.find(filter).populate("employeeId", "name employeeId department designation").lean(),
      Employee.find(req.companyId ? { companyId: req.companyId } : {}).select("name employeeId department designation").lean(),
    ]);

    const summary = employees.map((e) => {
      const mine = records.filter((r) => String(r.employeeId?._id) === String(e._id));
      const present = mine.filter((r) => r.status === "Present").length;
      const absent = mine.filter((r) => r.status === "Absent").length;
      const leave = mine.filter((r) => r.status === "Leave").length;
      const hours = mine.reduce((sum, r) => {
        if (r.checkIn && r.checkOut) {
          const breaksMs = (r.breaks || []).reduce((bSum, b) => {
            if (b?.start && b?.end) bSum += new Date(b.end) - new Date(b.start);
            return bSum;
          }, 0);
          sum += Math.max(0, (new Date(r.checkOut) - new Date(r.checkIn) - breaksMs)) / 3600000;
        }
        return sum;
      }, 0);
      return {
        name: e.name,
        employeeId: e.employeeId,
        department: e.department || "-",
        designation: e.designation || "-",
        present,
        absent,
        leave,
        totalHours: Math.round(hours * 100) / 100,
      };
    });

    return res.status(200).json(new ApiResponse(200, { month: m, year: y, data: summary }, "Report generated"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getLeaveReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const { from, to, m, y } = monthRange(month, year);
    const filter = { status: "Approved", startDate: { $gte: from, $lt: to } };
    if (req.companyId) {
      const employees = await Employee.find({ companyId: req.companyId }).select("_id");
      filter.employeeId = { $in: employees.map((e) => e._id) };
    }
    const data = await Leave.find(filter)
      .populate("employeeId", "name employeeId department")
      .sort({ startDate: 1 });
    return res.status(200).json(new ApiResponse(200, { month: m, year: y, data }, "Leave report generated"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getEventReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const { from, to, m, y } = monthRange(month, year);
    const data = await CalendarEvent.find({
      ...(req.companyId ? { companyId: req.companyId } : {}),
      start: { $gte: from, $lt: to },
    }).sort({ start: 1 });
    return res.status(200).json(new ApiResponse(200, { month: m, year: y, data }, "Event report generated"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const exportAttendanceCsv = async (req, res) => {
  try {
    const { month, year } = req.query;
    const { from, to } = monthRange(month, year);
    const filter = { date: { $gte: from, $lt: to } };
    if (req.companyId) {
      const employees = await Employee.find({ companyId: req.companyId }).select("_id");
      filter.employeeId = { $in: employees.map((e) => e._id) };
    }
    const records = await Attendance.find(filter)
      .populate("employeeId", "name employeeId department")
      .sort({ date: 1 });

    const rows = [
      ["Date", "Employee ID", "Name", "Department", "Status", "Check In", "Check Out", "Break Time", "Hours", "Late", "Overtime"],
      ...records.map((r) => {
        const breaksMs = (r.breaks || []).reduce((sum, b) => {
          if (b?.start && b?.end) sum += new Date(b.end) - new Date(b.start);
          return sum;
        }, 0);
        const breakMins = Math.round(breaksMs / 60000);
        const workMins = r.checkIn && r.checkOut
          ? Math.max(0, Math.round((new Date(r.checkOut) - new Date(r.checkIn) - breaksMs) / 60000))
          : 0;
        const toMin = (d) => {
          const t = new Date(d);
          return t.getHours() * 60 + t.getMinutes();
        };
        const late = r.checkIn ? Math.max(0, toMin(r.checkIn) - 9 * 60) : 0;
        const overtime = r.checkOut ? Math.max(0, toMin(r.checkOut) - 18 * 60) : 0;
        const fmtMins = (min) => {
          if (min <= 0) return "0";
          return `${Math.floor(min / 60)}h ${min % 60}m`;
        };
        return [
          r.date.toISOString().slice(0, 10),
          r.employeeId?.employeeId || "",
          r.employeeId?.name || "",
          r.employeeId?.department || "",
          r.status,
          r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "",
          r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "",
          fmtMins(breakMins),
          fmtMins(workMins),
          fmtMins(late),
          fmtMins(overtime),
        ];
      }),
    ];

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=attendance-${month}-${year}.csv`);
    return res.send(csv(rows));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const exportLeaveCsv = async (req, res) => {
  try {
    const { month, year } = req.query;
    const { from, to } = monthRange(month, year);
    const filter = { startDate: { $gte: from, $lt: to } };
    if (req.companyId) {
      const employees = await Employee.find({ companyId: req.companyId }).select("_id");
      filter.employeeId = { $in: employees.map((e) => e._id) };
    }
    const records = await Leave.find(filter)
      .populate("employeeId", "name employeeId department")
      .sort({ startDate: 1 });

    const rows = [
      ["Start Date", "End Date", "Employee ID", "Name", "Department", "Type", "Status", "Reason"],
      ...records.map((r) => [
        r.startDate.toISOString().slice(0, 10),
        r.endDate.toISOString().slice(0, 10),
        r.employeeId?.employeeId || "",
        r.employeeId?.name || "",
        r.employeeId?.department || "",
        r.leaveType,
        r.status,
        r.reason,
      ]),
    ];

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=leave-${month}-${year}.csv`);
    return res.send(csv(rows));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
