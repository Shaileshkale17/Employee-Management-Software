import express from "express";
import {
  CreateFinanceCoordination,
  GetAllFinanceCoordination,
  GetOneFinanceCoordination,
  UpdateFinanceCoordination,
  DeleteFinanceCoordination,
} from "../Controller/FinanceCoordination.js";
import { authMiddleware, tenantMiddleware, authorize } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware, authorize("Super Admin", "Company Admin", "HR", "HR Manager"));

router.post("/finance-post", (req, res) => CreateFinanceCoordination(req, res));
router.get("/finance-all", (req, res) => GetAllFinanceCoordination(req, res));
router.get("/finance-get/:id", (req, res) => GetOneFinanceCoordination(req, res));
router.put("/finance-update/:id", (req, res) => UpdateFinanceCoordination(req, res));
router.delete("/finance-delete/:id", (req, res) => DeleteFinanceCoordination(req, res));

export default router;
