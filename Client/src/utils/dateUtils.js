export const MS_DAY = 86400000;

export const toDate = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const startOfDay = (date) => {
  const d = toDate(date) || new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date) => {
  const d = toDate(date) || new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const addDays = (date, days) => {
  const d = toDate(date) || new Date();
  d.setDate(d.getDate() + days);
  return d;
};

export const addMonths = (date, months) => {
  const d = toDate(date) || new Date();
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
};

export const addMinutes = (date, minutes) => {
  const d = toDate(date) || new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d;
};

export const isSameDay = (a, b) => {
  const da = toDate(a);
  const db = toDate(b);
  if (!da || !db) return false;
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

export const isSameMonth = (a, b) => {
  const da = toDate(a);
  const db = toDate(b);
  if (!da || !db) return false;
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth();
};

export const isToday = (date) => isSameDay(date, new Date());

export const isPast = (date) => {
  const d = toDate(date);
  return d ? d.getTime() < Date.now() : false;
};

export const isBefore = (a, b) => {
  const da = toDate(a);
  const db = toDate(b);
  return da && db ? da.getTime() < db.getTime() : false;
};

export const diffDays = (a, b) => {
  const da = toDate(a);
  const db = toDate(b);
  if (!da || !db) return 0;
  return Math.round((startOfDay(da) - startOfDay(db)) / MS_DAY);
};

export const formatDate = (date, options = {}) => {
  const d = toDate(date);
  if (!d) return "";
  const { month = "short", day = "numeric", year, weekday } = options;
  return d.toLocaleDateString("en-US", { weekday, year, month, day });
};

export const formatTime = (date, options = {}) => {
  const d = toDate(date);
  if (!d) return "";
  const { hour = "2-digit", minute = "2-digit", hour12 = true } = options;
  return d.toLocaleTimeString("en-US", { hour, minute, hour12 });
};

export const formatDateTime = (date) => {
  const d = toDate(date);
  if (!d) return "";
  return `${formatDate(d, { weekday: "short", year: "numeric", month: "short", day: "numeric" })} · ${formatTime(d)}`;
};

export const formatRange = (start, end, allDay = false) => {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return "";
  if (allDay) {
    if (isSameDay(s, e)) return formatDate(s, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    return `${formatDate(s)} – ${formatDate(e)}`;
  }
  if (isSameDay(s, e)) return `${formatDate(s, { month: "short", day: "numeric", year: "numeric" })} · ${formatTime(s)} – ${formatTime(e)}`;
  return `${formatDate(s, { month: "short", day: "numeric", year: "numeric" })} ${formatTime(s)} – ${formatDate(e, { month: "short", day: "numeric", year: "numeric" })} ${formatTime(e)}`;
};

export const toISOLocal = (date) => {
  const d = toDate(date);
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fromISOLocal = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const toAPIDate = (date) => {
  const d = toDate(date);
  if (!d) return "";
  return d.toISOString();
};

export const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const getMonthGrid = (date) => {
  const first = startOfDay(date);
  first.setDate(1);
  const start = startOfDay(first);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
};

export const getWeekDays = (date) => {
  const start = startOfDay(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

export const getHours = (startHour = 0, endHour = 23) =>
  Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

export const hourLabel = (hour) => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return formatTime(d, { hour: "numeric", minute: "2-digit" });
};

export const minutesBetween = (start, end) => {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return 0;
  return Math.round((e - s) / 60000);
};

export const relativeDayLabel = (date, now = new Date()) => {
  const d = toDate(date);
  if (!d) return "";
  const days = diffDays(d, now);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return formatDate(d, { month: "short", day: "numeric" });
};

export const formatDuration = (start, end) => {
  const mins = minutesBetween(start, end);
  if (mins <= 0) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

export const getOverlap = (event, date) => {
  const d = toDate(date);
  if (!d || !event?.start) return false;
  const s = toDate(event.start);
  const e = toDate(event.end) || addMinutes(s, 60);
  const ds = startOfDay(d);
  const de = endOfDay(d);
  return s <= de && e >= ds;
};

export const timezoneName = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};
