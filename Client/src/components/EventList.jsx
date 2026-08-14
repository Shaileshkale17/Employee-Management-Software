import { Calendar } from "lucide-react";

const EventList = ({ title, date, time, organizer, type, status }) => {
  const statusStyles = {
    Upcoming: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
    Completed: "bg-blue-50 text-blue-700 ring-blue-500/20",
    default: "bg-amber-50 text-amber-700 ring-amber-500/20",
  };

  const statusClass = statusStyles[status] || statusStyles.default;

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-ink-200/50 bg-ink-50/40 p-3.5 transition-all duration-300 ease-smooth hover:bg-white hover:shadow-card-hover hover:border-ink-300">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm ring-1 ring-ink-200/70">
        <Calendar className="h-4.5 w-4.5 h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink-900 truncate">{title}</h3>
          <span className={`chip flex-shrink-0 ring-1 ${statusClass}`}>{status}</span>
        </div>
        <p className="text-xs text-ink-500 mt-1">
          {date} — {time}
        </p>
        <p className="text-xs text-ink-400 mt-0.5 line-clamp-1">
          <span className="font-medium text-ink-500">Organizer:</span> {organizer} &middot;{" "}
          <span className="font-medium text-ink-500">Type:</span> {type}
        </p>
      </div>
    </div>
  );
};

export default EventList;
