import mongoose from "mongoose";

const OnboardingSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    orientationDate: { type: Date },
    orientationStatus: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    documents: [
      {
        name: { type: String, required: true },
        status: {
          type: String,
          enum: ["Pending", "Verified", "Rejected"],
          default: "Pending",
        },
        notes: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    systemAccess: [
      {
        system: { type: String, required: true },
        status: {
          type: String,
          enum: ["Pending", "Granted", "Revoked"],
          default: "Pending",
        },
        notes: { type: String },
      },
    ],
    welcomeKit: {
      status: {
        type: String,
        enum: ["Pending", "Prepared", "Delivered"],
        default: "Pending",
      },
      items: { type: String },
      notes: { type: String },
    },
    assignedHR: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

const Onboarding = mongoose.model("Onboarding", OnboardingSchema);
export default Onboarding;
