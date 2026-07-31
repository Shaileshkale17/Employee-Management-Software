import express from "express";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../Controller/Notification.js";
import { authMiddleware, tenantMiddleware } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", (req, res) => getMyNotifications(req, res));
router.get("/unread-count", (req, res) => getUnreadCount(req, res));
router.put("/read-all", (req, res) => markAllAsRead(req, res));
router.put("/read/:id", (req, res) => markAsRead(req, res));
router.delete("/:id", (req, res) => deleteNotification(req, res));

export default router;
