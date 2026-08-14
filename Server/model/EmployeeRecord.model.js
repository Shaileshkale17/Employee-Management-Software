import mongoose from "mongoose";

const EmployeeRecordSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["maintaining-files", "records-updated", "confidential"],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["Active", "Review", "Archived"],
      default: "Active",
    },
    accessLevel: {
      type: String,
      enum: ["General", "Restricted", "Confidential"],
      default: "General",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

const EmployeeRecord = mongoose.model("EmployeeRecord", EmployeeRecordSchema);
export default EmployeeRecord;
