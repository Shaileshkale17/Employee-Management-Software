import mongoose from "mongoose";

const ShiftSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    shiftStart: { type: Date, required: true },
    shiftEnd: { type: Date, required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

export const Shift = mongoose.model("Shift", ShiftSchema);
