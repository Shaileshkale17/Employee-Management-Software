import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    checkHoldIn: { type: Date },
    checkHoldOut: { type: Date },
    status: {
      type: String,
      enum: ["Present", "Absent", "Leave"],
      required: true,
    },
    online: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Attendance = mongoose.model("Attendance", AttendanceSchema);
