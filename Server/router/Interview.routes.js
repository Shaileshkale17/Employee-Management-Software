import express from "express";
import {
  scheduleInterview,
  getAllInterviews,
  getMyInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
  updateInterviewFeedback,
  searchEmployees,
} from "../Controller/Interview.js";
import {
  authMiddleware,
  tenantMiddleware,
  authorize,
} from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.post(
  "/create",
  authorize("Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => scheduleInterview(req, res)
);
router.get("/all", (req, res) => getAllInterviews(req, res));
router.get("/my-interviews", (req, res) => getMyInterviews(req, res));
router.get("/show/:id", (req, res) => getInterviewById(req, res));
router.put(
  "/update/:id",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => updateInterview(req, res)
);
router.delete(
  "/delete/:id",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => deleteInterview(req, res)
);
router.put(
  "/feedback/:id",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => updateInterviewFeedback(req, res)
);
router.get("/employees/search", (req, res) => searchEmployees(req, res));

export default router;
