import mongoose from "mongoose";

const InvitationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true,
    },
    inviteeType: {
      type: String,
      enum: ["employee", "candidate", "guest"],
      default: "guest",
    },
    name: { type: String, default: "" },
    email: { type: String, required: true },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    token: { type: String, required: true, unique: true, index: true },
    otp: { type: String, default: "" },
    otpExpiresAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    usedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "sent", "accepted", "expired", "revoked"],
      default: "pending",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
  },
  { timestamps: true }
);

InvitationSchema.index({ meeting: 1, email: 1 });

export const MeetingInvitation = mongoose.model(
  "MeetingInvitation",
  InvitationSchema
);
export default MeetingInvitation;
