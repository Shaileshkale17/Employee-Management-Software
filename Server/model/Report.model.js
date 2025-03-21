import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    reportType: {
      type: String,
      enum: ["Attendance", "Salary", "Shift", "Leave"],
      required: true,
    },
    data: { type: Object, required: true },
  },
  { timestamps: true }
);

export const Report = mongoose.model("Report", ReportSchema);
