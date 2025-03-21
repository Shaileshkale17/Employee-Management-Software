import mongoose from "mongoose";

const salarySchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    totalPackage: {
      type: Number,
      required: true,
    },
    salaryInHand: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Salary = mongoose.model("Salary", salarySchema);
