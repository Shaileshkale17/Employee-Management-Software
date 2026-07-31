import express from "express";
import {
  createShift,
  getShifts,
  getMyShifts,
  updateShiftStatus,
  deleteShift,
} from "../Controller/Shift.js";
import { authMiddleware, tenantMiddleware, authorize } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/my", (req, res) => getMyShifts(req, res));

router.post("/", authorize("Super Admin", "Company Admin", "HR", "HR Manager"), (req, res) => createShift(req, res));
router.get("/", (req, res) => getShifts(req, res));
router.put("/:id", authorize("Super Admin", "Company Admin", "HR", "HR Manager"), (req, res) => updateShiftStatus(req, res));
router.delete("/:id", authorize("Super Admin", "Company Admin", "HR", "HR Manager"), (req, res) => deleteShift(req, res));

export default router;
