export const EVENT_TYPES = [
  { value: "meeting", label: "Meeting" },
  { value: "interview", label: "Interview" },
  { value: "event", label: "Event" },
  { value: "reminder", label: "Reminder" },
  { value: "task", label: "Task" },
  { value: "birthday", label: "Birthday" },
  { value: "holiday", label: "Holiday" },
  { value: "deadline", label: "Deadline" },
  { value: "important", label: "Important" },
];

export const TYPE_META = {
  meeting: { label: "Meeting", dot: "#7C3AED", chip: "bg-purple-50 text-purple-700 ring-purple-500/15", icon: "video" },
  interview: { label: "Interview", dot: "#6366F1", chip: "bg-indigo-50 text-indigo-700 ring-indigo-500/15", icon: "users" },
  event: { label: "Event", dot: "#0EA5E9", chip: "bg-sky-50 text-sky-700 ring-sky-500/15", icon: "sparkles" },
  reminder: { label: "Reminder", dot: "#F59E0B", chip: "bg-amber-50 text-amber-700 ring-amber-500/15", icon: "bell" },
  task: { label: "Task", dot: "#10B981", chip: "bg-emerald-50 text-emerald-700 ring-emerald-500/15", icon: "check" },
  birthday: { label: "Birthday", dot: "#EC4899", chip: "bg-pink-50 text-pink-700 ring-pink-500/15", icon: "cake" },
  holiday: { label: "Holiday", dot: "#F43F5E", chip: "bg-rose-50 text-rose-700 ring-rose-500/15", icon: "sun" },
  deadline: { label: "Deadline", dot: "#EA580C", chip: "bg-orange-50 text-orange-700 ring-orange-500/15", icon: "flag" },
  important: { label: "Important", dot: "#DC2626", chip: "bg-red-50 text-red-700 ring-red-500/15", icon: "alert" },
};

export const PRIORITIES = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" },
];

export const PRIORITY_META = {
  Low: { chip: "bg-ink-100 text-ink-600 ring-ink-500/10", label: "Low" },
  Medium: { chip: "bg-purple-50 text-purple-700 ring-purple-500/15", label: "Medium" },
  High: { chip: "bg-amber-50 text-amber-700 ring-amber-500/15", label: "High" },
  Urgent: { chip: "bg-red-50 text-red-700 ring-red-500/15", label: "Urgent" },
};

export const EVENT_STATUSES = [
  { value: "Scheduled", label: "Scheduled" },
  { value: "Ongoing", label: "Ongoing" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

export const STATUS_META = {
  Scheduled: { chip: "bg-purple-50 text-purple-700 ring-purple-500/15", label: "Scheduled", dot: "#7C3AED" },
  Ongoing: { chip: "bg-emerald-50 text-emerald-700 ring-emerald-500/15", label: "Ongoing", dot: "#10B981" },
  Completed: { chip: "bg-ink-100 text-ink-600 ring-ink-500/10", label: "Completed", dot: "#94A3B8" },
  Cancelled: { chip: "bg-red-50 text-red-700 ring-red-500/15", label: "Cancelled", dot: "#DC2626" },
};

export const CATEGORY_PRESETS = [
  { name: "General", color: "#7C3AED" },
  { name: "Team", color: "#0EA5E9" },
  { name: "Client", color: "#6366F1" },
  { name: "Personal", color: "#10B981" },
  { name: "Training", color: "#F59E0B" },
  { name: "Wellness", color: "#EC4899" },
  { name: "Finance", color: "#64748B" },
  { name: "HR", color: "#EA580C" },
];

export const RECURRENCE_FREQUENCIES = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom (pick days)" },
];

export const WEEKDAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export const REMINDER_OPTIONS = [
  { value: 0, label: "At time of event" },
  { value: 5, label: "5 minutes before" },
  { value: 10, label: "10 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
  { value: 1440, label: "1 day before" },
];

export const VISIBILITY_OPTIONS = [
  { value: "private", label: "Private — only me" },
  { value: "company", label: "Company — visible to everyone" },
];

export const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const EVENT_TYPE_OPTIONS = EVENT_TYPES;

export const snoozeOptions = [5, 10, 15, 30, 60, 120];

export const categoryColor = (name) => {
  const found = CATEGORY_PRESETS.find((c) => c.name === name);
  return found?.color || "#64748B";
};
