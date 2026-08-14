import express from "express";
import {
  CreatePerformance,
  GetAllPerformance,
  GetOnePerformance,
  UpdatePerformance,
  DeletePerformance,
} from "../Controller/Performance.js";
import { authMiddleware, tenantMiddleware, authorize } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware, authorize("Super Admin", "Company Admin", "HR", "HR Manager"));

router.post("/performance-post", (req, res) => CreatePerformance(req, res));
router.get("/performance-all", (req, res) => GetAllPerformance(req, res));
router.get("/performance-get/:id", (req, res) => GetOnePerformance(req, res));
router.put("/performance-update/:id", (req, res) => UpdatePerformance(req, res));
router.delete("/performance-delete/:id", (req, res) => DeletePerformance(req, res));

export default router;
