import express from "express";
import { getActivityLogs } from "../Controller/ActivityLog.js";
import {
  authMiddleware,
  tenantMiddleware,
  authorize,
} from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(
  authMiddleware,
  tenantMiddleware,
  authorize("Super Admin", "Company Admin", "HR", "HR Manager")
);

router.get("/", (req, res) => getActivityLogs(req, res));

export default router;
