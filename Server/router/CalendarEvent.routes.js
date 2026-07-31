import express from "express";
import {
  createEvent,
  getMyEvents,
  getUpcomingEvents,
  deleteEvent,
} from "../Controller/CalendarEvent.js";
import { authMiddleware, tenantMiddleware, authorize } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.post("/create", (req, res) => createEvent(req, res));
router.get("/my-events", (req, res) => getMyEvents(req, res));
router.get("/upcoming", (req, res) => getUpcomingEvents(req, res));
router.delete(
  "/delete/:id",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager"),
  (req, res) => deleteEvent(req, res)
);

export default router;
