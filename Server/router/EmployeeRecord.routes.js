import express from "express";
import {
  CreateEmployeeRecord,
  GetAllEmployeeRecords,
  GetOneEmployeeRecord,
  UpdateEmployeeRecord,
  DeleteEmployeeRecord,
} from "../Controller/EmployeeRecord.js";
import { authMiddleware, tenantMiddleware, authorize } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware, authorize("Super Admin", "Company Admin", "HR", "HR Manager"));

router.post("/record-post", (req, res) => CreateEmployeeRecord(req, res));
router.get("/record-all", (req, res) => GetAllEmployeeRecords(req, res));
router.get("/record-get/:id", (req, res) => GetOneEmployeeRecord(req, res));
router.put("/record-update/:id", (req, res) => UpdateEmployeeRecord(req, res));
router.delete("/record-delete/:id", (req, res) => DeleteEmployeeRecord(req, res));

export default router;
