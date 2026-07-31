import mongoose from "mongoose";

const JobSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    departmentName: { type: String, default: "" },
    location: { type: String, required: true },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance", "Temporary", "Volunteer", "Apprenticeship"],
      default: "Full-time",
    },
    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance", "Temporary", "Volunteer", "Apprenticeship"],
      default: "Full-time",
    },
    salary: { type: String, default: "" },
    salaryRange: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
    },
    skills: [{ type: String }],
    experience: { type: String, default: "" },
    responsibilities: [{ type: String }],
    qualifications: [{ type: String }],
    description: { type: String, default: "" },
    openings: { type: Number, default: 1 },
    lastDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Active", "Closed", "Draft", "Archived"],
      default: "Active",
    },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    applicantsCount: { type: Number, default: 0 },
    closedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", JobSchema);
export default Job;
