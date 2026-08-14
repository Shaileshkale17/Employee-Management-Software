import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  getMyEvents,
  getUpcomingEvents,
  getUpcomingPanel,
  getOverview,
  updateEvent,
  deleteEvent,
  duplicateEvent,
  updateEventStatus,
  snoozeEvent,
  uploadAttachment,
  getEventsByInterview,
} from "../Controller/CalendarEvent.js";
import { authMiddleware, tenantMiddleware } from "../Middlewares/AuthMiddleware.js";
import { uploadAttachments } from "../Middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.post("/create", (req, res) => createEvent(req, res));
router.get("/events", (req, res) => getEvents(req, res));
router.get("/upcoming-panel", (req, res) => getUpcomingPanel(req, res));
router.get("/upcoming", (req, res) => getUpcomingEvents(req, res));
router.get("/overview", (req, res) => getOverview(req, res));
router.get("/my-events", (req, res) => getMyEvents(req, res));
router.get("/interview-events", (req, res) => getEventsByInterview(req, res));
router.get("/:id", (req, res) => getEventById(req, res));

router.put("/update/:id", (req, res) => updateEvent(req, res));
router.patch("/:id/status", (req, res) => updateEventStatus(req, res));
router.post("/:id/duplicate", (req, res) => duplicateEvent(req, res));
router.post("/:id/snooze", (req, res) => snoozeEvent(req, res));
router.post("/:id/attachments", uploadAttachments, (req, res) => uploadAttachment(req, res));

router.delete("/delete/:id", (req, res) => deleteEvent(req, res));

export default router;
