import mongoose from "mongoose";

const PerformanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["appraisal", "goal", "feedback", "promotion"],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    feedbackType: {
      type: String,
      enum: ["Peer", "Manager", "Self"],
    },
    fromRole: { type: String },
    toRole: { type: String },
    effectiveDate: { type: Date },
    targetDate: { type: Date },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Approved", "Rejected"],
      default: "Pending",
    },
    description: { type: String },
  },
  { timestamps: true }
);

export const Performance = mongoose.model("Performance", PerformanceSchema);
