import express from "express";
import {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
} from "../Controller/Candidate.js";
import { authMiddleware, tenantMiddleware, authorize } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.post(
  "/create",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => createCandidate(req, res)
);
router.get("/all", (req, res) => getAllCandidates(req, res));
router.get("/show/:id", (req, res) => getCandidateById(req, res));
router.put(
  "/update/:id",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => updateCandidate(req, res)
);
router.delete(
  "/delete/:id",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"),
  (req, res) => deleteCandidate(req, res)
);

export default router;
