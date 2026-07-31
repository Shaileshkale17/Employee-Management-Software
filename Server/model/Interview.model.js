import mongoose from "mongoose";

const InterviewSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    interviewDate: { type: Date, required: true },
    duration: { type: Number, default: 60 },
    round: { type: String, default: "Round 1" },
    mode: {
      type: String,
      enum: ["In-person", "Video Call", "Phone", "Online", "Offline"],
      default: "Video Call",
    },
    meetingLink: { type: String, default: "" },
    panel: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    type: {
      type: String,
      enum: ["Technical", "HR", "Managerial", "Final"],
      default: "Technical",
    },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled", "Rescheduled"],
      default: "Scheduled",
    },
    notes: { type: String, default: "" },
    feedback: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, default: null },
    result: {
      type: String,
      enum: ["Pass", "Fail", "Hold", ""],
      default: "",
    },
    scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  },
  { timestamps: true }
);

const Interview = mongoose.model("Interview", InterviewSchema);
export default Interview;
