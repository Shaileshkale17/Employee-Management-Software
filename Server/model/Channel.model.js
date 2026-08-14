import mongoose from "mongoose";

const ChannelSchema = new mongoose.Schema(
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
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    pinnedMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeetingMessage",
      default: null,
    },
  },
  { timestamps: true }
);

export const MeetingChannel = mongoose.model(
  "MeetingChannel",
  ChannelSchema
);
export default MeetingChannel;
