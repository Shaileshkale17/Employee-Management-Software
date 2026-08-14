import mongoose from "mongoose";

const BenefitSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["health-insurance", "provident-fund", "perks"],
      required: true,
      index: true,
    },
    planName: { type: String },
    provider: { type: String },
    policyNumber: { type: String },
    amount: { type: Number, default: 0, min: 0 },
    coverage: { type: Number, default: 0, min: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["Active", "Pending", "Expired"],
      default: "Active",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Benefit = mongoose.model("Benefit", BenefitSchema);
