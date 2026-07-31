import express from "express";
import {
  sendMessage,
  getConversation,
  getConversations,
  markConversationRead,
  getUnreadCount,
} from "../Controller/Message.js";
import { authMiddleware, tenantMiddleware } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.post("/", (req, res) => sendMessage(req, res, req.app.locals.io));
router.get("/", (req, res) => getConversation(req, res));
router.get("/all", (req, res) => getConversations(req, res));
router.get("/unread", (req, res) => getUnreadCount(req, res));
router.put("/read", (req, res) => markConversationRead(req, res));

export default router;
