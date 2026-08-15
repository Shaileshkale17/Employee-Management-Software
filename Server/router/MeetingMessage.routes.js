import express from "express";
import {
  sendMessage,
  getMessages,
  reactToMessage,
  deleteMessage,
  getChannelMessages,
  searchMessages,
} from "../Controller/MeetingMessage.js";
import { authMiddleware, tenantMiddleware } from "../Middlewares/AuthMiddleware.js";
import { authOrGuest } from "../Middlewares/meetingAuthMiddleware.js";
import { uploadAttachments, cloudinaryUpload } from "../Middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(authOrGuest, authMiddleware, tenantMiddleware);

router.get("/search", (req, res) => searchMessages(req, res));
router.get("/channel/:channelId", (req, res) => getChannelMessages(req, res));
router.get("/:meetingId", (req, res) => getMessages(req, res));
router.post("/:meetingId", uploadAttachments, cloudinaryUpload, (req, res) => sendMessage(req, res));

router.post("/react/:messageId", (req, res) => reactToMessage(req, res));
router.delete("/:messageId", (req, res) => deleteMessage(req, res));

export default router;
