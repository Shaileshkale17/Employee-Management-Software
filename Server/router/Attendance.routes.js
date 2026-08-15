import express from "express";
import {
  clockIn,
  clockOut,
  toggleBreak,
  getTodayAttendance,
  getMyAttendance,
  getAllAttendance,
  updateAttendance,
  getAttendanceSummary,
  getAttendanceCalendar,
  getAttendanceTodaySummary,
  autoMarkAbsent,
  generateQrSession,
  validateQrSession,
} from "../Controller/Attendance.js";
import { authMiddleware, tenantMiddleware, authorize } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/qr/session", (req, res) => generateQrSession(req, res));
router.post("/qr/validate", (req, res) => validateQrSession(req, res));

router.post("/clock-in", (req, res) => clockIn(req, res, req.app.locals.io));
router.post("/clock-out", (req, res) => clockOut(req, res, req.app.locals.io));
router.post("/break", (req, res) => toggleBreak(req, res));
router.get("/today", (req, res) => getTodayAttendance(req, res));
router.get("/my", (req, res) => getMyAttendance(req, res));
router.get("/summary", (req, res) => getAttendanceSummary(req, res));
router.get("/today-summary", (req, res) => getAttendanceTodaySummary(req, res));
router.get("/calendar", (req, res) => getAttendanceCalendar(req, res));

router.get("/", (req, res) => getAllAttendance(req, res));
router.put("/:id", authorize("Super Admin", "Company Admin", "HR", "HR Manager"), (req, res) => updateAttendance(req, res));
router.post("/auto-mark-absent", authorize("Super Admin", "Company Admin", "HR", "HR Manager"), (req, res) => autoMarkAbsent(req, res));

export default router;
