import { markEmployeesAbsent } from "../Controller/Attendance.js";

const CHECK_INTERVAL_MS = 30 * 1000;
const DEFAULT_CUTOFF_TIME = "18:00";

let timer = null;
let lastRunKey = null;

export const getCutoffMinutes = () => {
  const [h, m] = (process.env.ATTENDANCE_CUTOFF_TIME || DEFAULT_CUTOFF_TIME).split(":").map(Number);
  return (Number.isFinite(h) ? h : 18) * 60 + (Number.isFinite(m) ? m : 0);
};

export const localDateKey = (date = new Date()) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

export const isTimeToRun = (now = new Date(), lastRunKey = null) => {
  if (now.getHours() * 60 + now.getMinutes() < getCutoffMinutes()) return false;
  return localDateKey(now) !== lastRunKey;
};

const processDailyAbsence = async () => {
  const now = new Date();
  if (!isTimeToRun(now, lastRunKey)) return;
  lastRunKey = localDateKey(now);

  try {
    const { marked } = await markEmployeesAbsent();
    console.log(`[Attendance Scheduler] Marked ${marked} employee(s) absent for ${localDateKey(now)}`);
  } catch (error) {
    console.error("Attendance scheduler error:", error.message);
  }
};

export const startAttendanceScheduler = () => {
  if (timer) return;
  processDailyAbsence();
  timer = setInterval(processDailyAbsence, CHECK_INTERVAL_MS);
  timer.unref?.();
};

export const stopAttendanceScheduler = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};
