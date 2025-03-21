import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    head: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }, // Head of the department
  },
  { timestamps: true }
);

export const Department = mongoose.model("Department", departmentSchema);
