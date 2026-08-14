import mongoose from "mongoose";

const ReminderSchema = new mongoose.Schema(
  {
    at: { type: Date, required: true },
    minutesBefore: { type: Number, default: 0 },
    sentAt: { type: Date, default: null },
  },
  { _id: false }
);

const AttachmentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    url: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

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

const OverrideSchema = new mongoose.Schema(
  {
    originalStart: { type: Date, required: true },
    start: { type: Date, default: null },
    end: { type: Date, default: null },
    title: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Scheduled", "Ongoing", "Completed", "Cancelled"],
      default: "",
    },
  },
  { _id: false }
);

const HistorySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    field: { type: String, default: "" },
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CalendarEventSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    start: { type: Date, required: true, index: true },
    end: { type: Date, default: null },
    allDay: { type: Boolean, default: false },
    timezone: { type: String, default: "" },
    type: {
      type: String,
      enum: [
        "meeting",
        "interview",
        "event",
        "reminder",
        "task",
        "birthday",
        "holiday",
        "deadline",
        "important",
      ],
      default: "meeting",
    },
    category: {
      name: { type: String, default: "General" },
      color: { type: String, default: "#3354F4" },
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Scheduled", "Ongoing", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    location: { type: String, default: "" },
    meetingLink: { type: String, default: "" },
    meetingPlatform: {
      type: String,
      enum: [
        "google-meet",
        "microsoft-teams",
        "zoom",
        "webex",
        "slack-huddle",
        "custom",
        "",
      ],
      default: "",
    },
    tags: [{ type: String }],
    attachments: { type: [AttachmentSchema], default: [] },
    notes: { type: String, default: "" },
    agenda: { type: String, default: "" },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        index: true,
      },
    ],
    visibility: {
      type: String,
      enum: ["private", "company"],
      default: "private",
    },
    recurrence: { type: RecurrenceSchema, default: () => ({}) },
    excludedDates: { type: [Date], default: [] },
    overrides: { type: [OverrideSchema], default: [] },
    reminders: { type: [ReminderSchema], default: [] },
    snoozeUntil: { type: Date, default: null },
    history: { type: [HistorySchema], default: [] },
    source: {
      type: String,
      enum: ["manual", "interview", "task", "event", "holiday", "birthday", "system"],
      default: "manual",
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "sourceRef",
      default: null,
    },
    sourceRef: {
      type: String,
      enum: ["Interview", "Task", "Event", "Meeting", null],
      default: null,
    },
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      default: null,
    },
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      default: null,
    },
    link: { type: String, default: "" },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

CalendarEventSchema.index({ company: 1, start: 1 });
CalendarEventSchema.index({ organizer: 1, start: 1 });
CalendarEventSchema.index({ participants: 1, start: 1 });

const CalendarEvent = mongoose.model("CalendarEvent", CalendarEventSchema);
export default CalendarEvent;
