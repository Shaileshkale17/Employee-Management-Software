import express from "express";
import {
  applyLeave,
  getMyLeaves,
  getLeaveBalance,
  getAllLeaves,
  updateLeaveStatus,
  getLeaveSummary,
} from "../Controller/Leave.js";
import { authMiddleware, tenantMiddleware, authorize } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.post("/", (req, res) => applyLeave(req, res));
router.get("/my", (req, res) => getMyLeaves(req, res));
router.get("/balance", (req, res) => getLeaveBalance(req, res));
router.get("/summary", (req, res) => getLeaveSummary(req, res));

router.get("/", (req, res) => getAllLeaves(req, res));
router.put("/:id/status", authorize("Super Admin", "Company Admin", "HR", "HR Manager"), (req, res) => updateLeaveStatus(req, res));

export default router;
