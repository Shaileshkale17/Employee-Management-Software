import mongoose from "mongoose";

const CandidateSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    skills: [{ type: String }],
    experience: { type: String, default: "" },
    education: { type: String, default: "" },
    resume: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    coverLetter: { type: String, default: "" },
    source: { type: String, default: "" },
    status: {
      type: String,
      enum: ["New", "Screening", "Shortlisted", "Interviewed", "Offered", "Hired", "Rejected"],
      default: "New",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const Candidate = mongoose.model("Candidate", CandidateSchema);
export default Candidate;
