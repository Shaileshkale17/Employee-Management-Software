import express from "express";
import {
  CreatePayroll,
  GetAllPayroll,
  GetOnePayroll,
  UpdatePayroll,
  DeletePayroll,
} from "../Controller/Payroll.js";
import { authMiddleware, tenantMiddleware, authorize } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware, authorize("Super Admin", "Company Admin", "HR", "HR Manager"));

router.post("/payroll-post", (req, res) => CreatePayroll(req, res));
router.get("/payroll-all", (req, res) => GetAllPayroll(req, res));
router.get("/payroll-get/:id", (req, res) => GetOnePayroll(req, res));
router.put("/payroll-update/:id", (req, res) => UpdatePayroll(req, res));
router.delete("/payroll-delete/:id", (req, res) => DeletePayroll(req, res));

export default router;
