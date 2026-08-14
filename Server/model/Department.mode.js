import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    description: { type: String },
    head: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  },
  { timestamps: true }
);

DepartmentSchema.index({ name: 1, companyId: 1 }, { unique: true });

export const Department = mongoose.model("Department", DepartmentSchema);
