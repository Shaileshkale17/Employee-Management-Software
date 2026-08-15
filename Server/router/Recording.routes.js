import express from "express";
import {
  getRecordings,
  createRecording,
  updateRecording,
  deleteRecording,
  getMeetingNotes,
  saveMeetingNotes,
} from "../Controller/Recording.js";
import { authMiddleware, tenantMiddleware } from "../Middlewares/AuthMiddleware.js";
import { uploadResume, cloudinaryUpload } from "../Middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/notes/:id", (req, res) => getMeetingNotes(req, res));
router.post("/notes/:id", (req, res) => saveMeetingNotes(req, res));
router.get("/:id", (req, res) => getRecordings(req, res));
router.post("/:id", uploadResume, cloudinaryUpload, (req, res) => createRecording(req, res));
router.put("/:recordingId", (req, res) => updateRecording(req, res));
router.delete("/:recordingId", (req, res) => deleteRecording(req, res));

export default router;
