import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    message: { type: String, required: true },
    status: { type: String, enum: ["Read", "Unread"], default: "Unread" },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", NotificationSchema);
