import express from "express";
import {
  registerCompany,
  verifyCompanyEmail,
  getCompanyProfile,
  getPublicCompany,
  updateCompany,
  getCompanyDepartments,
  createDepartment,
  companyDashboardStats,
} from "../Controller/Company.js";
import {
  authMiddleware,
  tenantMiddleware,
  authorize,
} from "../Middlewares/AuthMiddleware.js";
import { uploadLogo, cloudinaryUpload } from "../Middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/register", uploadLogo, cloudinaryUpload, (req, res) => registerCompany(req, res));
router.get("/verify-email", (req, res) => verifyCompanyEmail(req, res));
router.get("/public/:slug", (req, res) => getPublicCompany(req, res));

router.use(authMiddleware, tenantMiddleware);

router.get("/profile", (req, res) => getCompanyProfile(req, res));
router.put("/profile", (req, res) => updateCompany(req, res));
router.get("/departments", (req, res) => getCompanyDepartments(req, res));
router.post(
  "/departments",
  authorize("Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => createDepartment(req, res)
);
router.get("/stats", (req, res) => companyDashboardStats(req, res));

export default router;
