import mongoose from "mongoose";

const RecurrenceSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "custom", "none"],
      default: "none",
    },
    interval: { type: Number, min: 1, default: 1 },
    daysOfWeek: { type: [Number], default: [] },
    dayOfMonth: { type: Number, min: 1, max: 31, default: null },
    endDate: { type: Date, default: null },
    count: { type: Number, min: 1, default: null },
  },
  { _id: false }
);

const MeetingSettingsSchema = new mongoose.Schema(
  {
    waitingRoom: { type: Boolean, default: true },
    hostApproval: { type: Boolean, default: true },
    requirePassword: { type: Boolean, default: false },
    meetingPassword: { type: String, default: "" },
    recordMeeting: { type: Boolean, default: true },
    allowChat: { type: Boolean, default: true },
    allowScreenShare: { type: Boolean, default: true },
    allowParticipantsMic: { type: Boolean, default: true },
    allowParticipantsCamera: { type: Boolean, default: true },
    autoSummary: { type: Boolean, default: true },
    restrictPermissions: { type: Boolean, default: false },
    breakoutsEnabled: { type: Boolean, default: false },
  },
  { _id: false }
);

const MeetingSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    agenda: { type: String, default: "" },
    timezone: { type: String, default: "" },
    start: { type: Date, required: true, index: true },
    end: { type: Date, default: null },
    duration: { type: Number, min: 5, default: 60 },
    type: {
      type: String,
      enum: ["instant", "scheduled", "personal-room"],
      default: "scheduled",
    },
    meetingId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["upcoming", "live", "completed", "cancelled"],
      default: "upcoming",
      index: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    interviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      default: null,
    },
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      default: null,
    },
    isRecurring: { type: Boolean, default: false },
    recurrence: { type: RecurrenceSchema, default: () => ({}) },
    encryptedLink: { type: String, default: "" },
    guestJoinEnabled: { type: Boolean, default: true },
    passwordProtected: { type: Boolean, default: false },
    waitingRoomEnabled: { type: Boolean, default: true },
    hostApprovalRequired: { type: Boolean, default: true },
    settings: { type: MeetingSettingsSchema, default: () => ({}) },
    calendarEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CalendarEvent",
      default: null,
    },
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeetingChannel",
      default: null,
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    liveParticipantCount: { type: Number, default: 0 },
    missedReason: { type: String, default: "" },
    personalRoomOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
  },
  { timestamps: true }
);

MeetingSchema.index({ company: 1, start: -1 });
MeetingSchema.index({ organizer: 1, start: -1 });
MeetingSchema.index({ status: 1, start: -1 });

export const Meeting = mongoose.model("Meeting", MeetingSchema);
export default Meeting;
