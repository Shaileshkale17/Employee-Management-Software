import mongoose from "mongoose";

const ApplicationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
    appliedDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Applied", "Screening", "Shortlisted", "Interview", "Offer", "Hired", "Rejected"],
      default: "Applied",
    },
    notes: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, default: null },
    coverLetter: { type: String, default: "" },
    timeline: [
      {
        status: { type: String },
        note: { type: String, default: "" },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Application = mongoose.model("Application", ApplicationSchema);
export default Application;
