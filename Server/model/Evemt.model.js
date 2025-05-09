import mongoose, { mongo } from "mongoose";
const EventSchema = mongoose.Schema(
  {
    taskTitle: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    StartDate: {
      type: String,
      default: "10/05/2025, 00:03:58",
    },
    EndDate: {
      type: String,
      default: "10/05/2025, 00:03:58",
    },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", EventSchema);

export default Event;
