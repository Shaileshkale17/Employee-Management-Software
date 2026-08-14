import { Message } from "../model/Message.model.js";
import { Employee } from "../model/Employee.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const sendMessage = async (req, res) => {
  try {
    const { recipient, text } = req.body;
    if (!recipient || !text?.trim()) {
      return res.status(400).json(new ApiError(400, "Recipient and message text are required"));
    }
    if (String(recipient) === String(req.user.id)) {
      return res.status(400).json(new ApiError(400, "Cannot send a message to yourself"));
    }
    const target = await Employee.findOne({ _id: recipient, companyId: req.companyId });
    if (!target) return res.status(404).json(new ApiError(404, "Recipient not found"));

    const data = await Message.create({
      companyId: req.companyId,
      sender: req.user.id,
      recipient,
      text: text.trim(),
    });

    if (req.io) {
      req.io.to(`user:${recipient}`).emit("chat:message", {
        ...data.toObject(),
        senderName: req.employee?.name || "",
      });
      req.io.to(`user:${req.user.id}`).emit("chat:message", data);
    }

    return res.status(201).json(new ApiResponse(201, data, "Message sent"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getConversation = async (req, res) => {
  try {
    const { with: other } = req.query;
    if (!other) return res.status(400).json(new ApiError(400, "Recipient ID required"));
    const data = await Message.find({
      $or: [
        { sender: req.user.id, recipient: other },
        { sender: other, recipient: req.user.id },
      ],
    })
      .populate("sender", "name email")
      .sort({ createdAt: 1 })
      .limit(200);

    await Message.updateMany(
      { sender: other, recipient: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );

    if (req.io) {
      req.io.to(`user:${other}`).emit("chat:read", {
        with: req.user.id,
        readAt: new Date().toISOString(),
      });
    }

    return res.status(200).json(new ApiResponse(200, data, "Conversation fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getConversations = async (req, res) => {
  try {
    const data = await Message.aggregate([
      { $match: { $or: [{ sender: req.user.id }, { recipient: req.user.id }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", req.user.id] },
              "$recipient",
              "$sender",
            ],
          },
          lastMessage: { $first: "$text" },
          lastMessageAt: { $first: "$createdAt" },
          lastSender: { $first: "$sender" },
          unread: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$recipient", req.user.id] }, { $eq: ["$read", false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      { $limit: 100 },
    ]);

    const otherIds = data.map((c) => c._id);
    const users = await Employee.find({ _id: { $in: otherIds } }).select("name email employeeId designation");
    const userMap = {};
    for (const u of users) userMap[String(u._id)] = u;

    const result = data.map((c) => ({
      _id: c._id,
      user: userMap[String(c._id)] || null,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      unread: c.unread,
      lastSender: c.lastSender,
    }));

    return res.status(200).json(new ApiResponse(200, result, "Conversations fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const markConversationRead = async (req, res) => {
  try {
    const { with: other } = req.body;
    if (!other) return res.status(400).json(new ApiError(400, "Sender ID required"));
    await Message.updateMany(
      { sender: other, recipient: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );
    if (req.io) {
      req.io.to(`user:${other}`).emit("chat:read", {
        with: req.user.id,
        readAt: new Date().toISOString(),
      });
    }
    return res.status(200).json(new ApiResponse(200, null, "Messages marked as read"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ recipient: req.user.id, read: false });
    return res.status(200).json(new ApiResponse(200, { count }, "Unread count fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
