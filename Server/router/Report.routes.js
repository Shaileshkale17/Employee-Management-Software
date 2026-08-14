import express from "express";
import {
  getEmployeeReport,
  getLeaveReport,
  getEventReport,
  exportAttendanceCsv,
  exportLeaveCsv,
} from "../Controller/Report.js";
import { authMiddleware, tenantMiddleware, authorize } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware, authorize("Super Admin", "Company Admin", "HR", "HR Manager"));

router.get("/attendance", (req, res) => getEmployeeReport(req, res));
router.get("/leave", (req, res) => getLeaveReport(req, res));
router.get("/event", (req, res) => getEventReport(req, res));
router.get("/export/attendance", (req, res) => exportAttendanceCsv(req, res));
router.get("/export/leave", (req, res) => exportLeaveCsv(req, res));

export default router;
