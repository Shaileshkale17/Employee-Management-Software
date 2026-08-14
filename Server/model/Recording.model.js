import mongoose from "mongoose";

const ActionItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    assignee: { type: String, default: "" },
    status: { type: String, enum: ["pending", "done", "snoozed"], default: "pending" },
  },
  { _id: false }
);

const RecordingSchema = new mongoose.Schema(
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
    name: { type: String, default: "" },
    url: { type: String, default: "" },
    filename: { type: String, default: "" },
    size: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    mimeType: { type: String, default: "" },
    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "processing",
    },
    transcriptUrl: { type: String, default: "" },
    transcript: { type: String, default: "" },
    summary: { type: String, default: "" },
    actionItems: { type: [ActionItemSchema], default: [] },
    notes: { type: String, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
  },
  { timestamps: true }
);

export const Recording = mongoose.model("Recording", RecordingSchema);
export default Recording;
