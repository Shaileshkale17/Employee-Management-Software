import express from "express";
import {
  applyToJob,
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  addApplicationNote,
  deleteApplication,
  getApplicationsByJob,
  pipelineStats,
} from "../Controller/Application.js";
import {
  authMiddleware,
  tenantMiddleware,
  authorize,
} from "../Middlewares/AuthMiddleware.js";
import { uploadResume, cloudinaryUpload } from "../Middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/apply/:slug/:jobId", uploadResume, cloudinaryUpload, (req, res) => applyToJob(req, res));

router.use(authMiddleware, tenantMiddleware);

router.post(
  "/create",
  authorize("Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => createApplication(req, res)
);
router.get("/all", (req, res) => getAllApplications(req, res));
router.get("/pipeline-stats", (req, res) => pipelineStats(req, res));
router.get("/show/:id", (req, res) => getApplicationById(req, res));
router.put("/update-status/:id", (req, res) => updateApplicationStatus(req, res));
router.post(
  "/:id/notes",
  authorize("Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => addApplicationNote(req, res)
);
router.delete("/delete/:id", (req, res) => deleteApplication(req, res));
router.get("/by-job/:jobId", (req, res) => getApplicationsByJob(req, res));

export default router;
