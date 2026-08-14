import mongoose from "mongoose";

const AttachmentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    url: { type: String, default: "" },
    size: { type: Number, default: 0 },
    type: { type: String, default: "" },
  },
  { _id: false }
);

const ReactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true },
    userId: { type: String, default: "" },
    userType: { type: String, enum: ["employee", "guest", "system"], default: "employee" },
  },
  { _id: false }
);

const MeetingMessageSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true,
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeetingChannel",
      default: null,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    senderName: { type: String, default: "" },
    senderEmail: { type: String, default: "" },
    senderType: {
      type: String,
      enum: ["employee", "guest", "system"],
      default: "employee",
    },
    text: { type: String, default: "" },
    attachments: { type: [AttachmentSchema], default: [] },
    reactions: { type: [ReactionSchema], default: [] },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeetingMessage",
      default: null,
    },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MeetingMessageSchema.index({ meeting: 1, createdAt: 1 });
MeetingMessageSchema.index({ channel: 1, createdAt: 1 });

export const MeetingMessage = mongoose.model(
  "MeetingMessage",
  MeetingMessageSchema
);
export default MeetingMessage;
