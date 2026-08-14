import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    joinedAt: { type: Date, default: null },
    leftAt: { type: Date, default: null },
    durationMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "present", "absent", "late", "left"],
      default: "pending",
    },
    wasHost: { type: Boolean, default: false },
  },
  { _id: false }
);

const ParticipantSchema = new mongoose.Schema(
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
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      default: null,
    },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    participantType: {
      type: String,
      enum: ["employee", "guest", "candidate"],
      default: "employee",
    },
    role: {
      type: String,
      enum: [
        "host",
        "cohost",
        "moderator",
        "interviewer",
        "candidate",
        "attendee",
      ],
      default: "attendee",
    },
    status: {
      type: String,
      enum: [
        "invited",
        "accepted",
        "declined",
        "waiting",
        "admitted",
        "joined",
        "left",
        "no-show",
      ],
      default: "invited",
      index: true,
    },
    invitation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeetingInvitation",
      default: null,
    },
    joinToken: { type: String, default: "" },
    verified: { type: Boolean, default: false },
    deviceInfo: {
      userAgent: { type: String, default: "" },
      platform: { type: String, default: "" },
      ip: { type: String, default: "" },
    },
    attendance: { type: AttendanceSchema, default: () => ({}) },
  },
  { timestamps: true }
);

ParticipantSchema.index({ meeting: 1, employee: 1 });
ParticipantSchema.index({ meeting: 1, email: 1 });
ParticipantSchema.index({ companyId: 1, "attendance.status": 1 });

export const MeetingParticipant = mongoose.model(
  "MeetingParticipant",
  ParticipantSchema
);
export default MeetingParticipant;
