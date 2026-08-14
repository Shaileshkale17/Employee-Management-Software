import mongoose from "mongoose";

const BreakSchema = new mongoose.Schema(
  {
    start: { type: Date, default: null },
    end: { type: Date, default: null },
  },
  { _id: false }
);

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
    breaks: { type: [BreakSchema], default: [] },
    status: {
      type: String,
      enum: ["Present", "Absent", "Leave"],
      required: true,
    },
    online: {
      type: Boolean,
      default: false,
    },
    totalMinutes: { type: Number, default: 0 },
    breakMinutes: { type: Number, default: 0 },
    overtimeMinutes: { type: Number, default: 0 },
    lateMinutes: { type: Number, default: 0 },
    earlyExitMinutes: { type: Number, default: 0 },
    isLate: { type: Boolean, default: false },
    isEarlyExit: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      index: true,
    },
  },
  { timestamps: true }
);

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", AttendanceSchema);
export default Attendance;
