import mongoose from "mongoose";

const FinanceCoordinationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    recordType: {
      type: String,
      enum: ["Salary", "Bonus", "Incentive", "Reimbursement", "Other"],
      default: "Salary",
    },
    amount: { type: Number, default: 0, min: 0 },
    period: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Sent", "Confirmed", "Rejected"],
      default: "Pending",
    },
    financeContact: { type: String },
    sentAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

export const FinanceCoordination = mongoose.model(
  "FinanceCoordination",
  FinanceCoordinationSchema
);
