import express from "express";
import {
  createJob,
  getAllJobs,
  getJobById,
  getPublicJobs,
  getPublicJob,
  updateJob,
  deleteJob,
  duplicateJob,
  closeJob,
  archiveJob,
  reopenJob,
} from "../Controller/Job.js";
import {
  authMiddleware,
  tenantMiddleware,
  authorize,
} from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.get("/public/:slug", (req, res) => getPublicJobs(req, res));
router.get("/public/:slug/:jobId", (req, res) => getPublicJob(req, res));

router.use(authMiddleware, tenantMiddleware);

router.post(
  "/create",
  authorize("Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => createJob(req, res)
);
router.get("/all", (req, res) => getAllJobs(req, res));
router.get("/show/:id", (req, res) => getJobById(req, res));
router.put(
  "/update/:id",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => updateJob(req, res)
);
router.delete(
  "/delete/:id",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => deleteJob(req, res)
);
router.post(
  "/duplicate/:id",
  authorize("Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => duplicateJob(req, res)
);
router.put(
  "/close/:id",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => closeJob(req, res)
);
router.put(
  "/archive/:id",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => archiveJob(req, res)
);
router.put(
  "/reopen/:id",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => reopenJob(req, res)
);

export default router;
