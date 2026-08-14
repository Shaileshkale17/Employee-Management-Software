import express from "express";
import { getActivityLogs } from "../Controller/ActivityLog.js";
import { authMiddleware, tenantMiddleware } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", (req, res) => getActivityLogs(req, res));

export default router;
