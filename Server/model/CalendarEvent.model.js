import mongoose from "mongoose";

const CalendarEventSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    start: { type: Date, required: true },
    end: { type: Date },
    type: {
      type: String,
      enum: ["interview", "meeting", "event", "reminder"],
      default: "meeting",
    },
    link: { type: String, default: "" },
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      default: null,
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  { timestamps: true }
);

const CalendarEvent = mongoose.model("CalendarEvent", CalendarEventSchema);
export default CalendarEvent;
