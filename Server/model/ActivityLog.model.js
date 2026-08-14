import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      index: true,
    },
    action: { type: String, required: true },
    module: { type: String, default: "general" },
    targetType: { type: String, default: "" },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    details: { type: Object, default: {} },
    ip: { type: String, default: "" },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);
