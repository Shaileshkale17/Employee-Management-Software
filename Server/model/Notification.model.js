import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "recipientModel",
      required: true,
      index: true,
    },
    recipientModel: {
      type: String,
      enum: ["Employee", "Candidate"],
      default: "Employee",
    },
    title: { type: String, default: "" },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "interview", "application", "job", "system", "message"],
      default: "info",
    },
    link: { type: String, default: "" },
    status: { type: String, enum: ["Read", "Unread"], default: "Unread" },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", NotificationSchema);
