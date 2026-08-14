import mongoose from "mongoose";

const PayrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["salary", "bonus", "incentive"],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    period: { type: String },
    paymentDate: { type: Date },
    status: {
      type: String,
      enum: ["Draft", "Approved", "Paid"],
      default: "Draft",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Payroll = mongoose.model("Payroll", PayrollSchema);
