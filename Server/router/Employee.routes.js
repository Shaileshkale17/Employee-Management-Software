import express from "express";
import {
  EmployeeAllInfo,
  EmployeeInfoDeleted,
  EmployeeInfoUpdate,
  EmployeeOneInfo,
  LoginEmployee,
  createEmployee,
  verifyMfaOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword,
  toggleMfa,
  getProfile,
  updateProfile,
  getEmployeeStats,
  getEmployeeDirectory,
} from "../Controller/Employee.js";
import {
  authMiddleware,
  tenantMiddleware,
  authorize,
} from "../Middlewares/AuthMiddleware.js";
import { authLimiter } from "../Middlewares/rateLimiter.js";

const router = express.Router();

router.post("/emp-login", authLimiter, (req, res) =>
  LoginEmployee(req, res, req.app.locals.io)
);
router.post("/verify-mfa", authLimiter, (req, res) => verifyMfaOtp(req, res));
router.post("/forgot-password", authLimiter, (req, res) => forgotPassword(req, res));
router.post("/verify-otp", authLimiter, (req, res) => verifyResetOtp(req, res));
router.post("/reset-password", authLimiter, (req, res) => resetPassword(req, res));

router.use(authMiddleware, tenantMiddleware);

router.get("/profile", (req, res) => getProfile(req, res));
router.put("/profile", (req, res) => updateProfile(req, res));
router.put("/change-password", (req, res) => changePassword(req, res));
router.put("/mfa", (req, res) => toggleMfa(req, res));
router.get("/stats", (req, res) => getEmployeeStats(req, res));
router.get("/directory", (req, res) => getEmployeeDirectory(req, res));

router.post(
  "/emp-post",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager"),
  (req, res) => createEmployee(req, res, req.app.locals.io)
);
router.get("/emp-get", (req, res) =>
  EmployeeAllInfo(req, res, req.app.locals.io)
);
router.get("/emp-get-one/:id", (req, res) =>
  EmployeeOneInfo(req, res, req.app.locals.io)
);
router.put(
  "/emp-get-update/:id",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager"),
  (req, res) => EmployeeInfoUpdate(req, res, req.app.locals.io)
);
router.delete(
  "/emp-get-deleted/:id",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager"),
  (req, res) => EmployeeInfoDeleted(req, res, req.app.locals.io)
);

export default router;
