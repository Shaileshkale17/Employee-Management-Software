import { useMemo } from "react";
import { Calendar, MapPin } from "lucide-react";
import { isToday, relativeDayLabel, formatTime } from "../../utils/dateUtils";
import { TYPE_META, PRIORITY_META } from "./calendarMeta";
import EmptyState from "../EmptyState";

const AgendaEvent = ({ event, onClick }) => {
  const meta = TYPE_META[event.type] || TYPE_META.meeting;
  const color = event.category?.color || meta.dot;
  const prio = PRIORITY_META[event.priority] || PRIORITY_META.Medium;
  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      className="group flex w-full items-center gap-4 rounded-xl border border-ink-200/50 bg-white px-4 py-3 text-left transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover">
      <span className="hidden sm:flex h-10 w-[52px] flex-col items-center justify-center rounded-lg ring-1 ring-ink-200/50" style={{ backgroundColor: `${color}0F` }}>
        <span className="text-[10px] font-semibold text-ink-400 uppercase">
          {new Date(event.start).toLocaleDateString("en-US", { month: "short" })}
        </span>
        <span className="text-base font-bold leading-none" style={{ color }}>
          {new Date(event.start).getDate()}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">{event.title}</p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-400">
          {!event.allDay && <span className="font-medium">{formatTime(event.start)}</span>}
          {event.allDay && <span>All day</span>}
          {event.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {event.location}
            </span>
          )}
        </p>
      </div>
      <div className="hidden md:flex flex-shrink-0 items-center gap-1.5">
        <span className={`chip ring-1 ${meta.chip}`}>{meta.label}</span>
        <span className={`chip ring-1 ${prio.chip}`}>{prio.label}</span>
      </div>
    </button>
  );
};

const AgendaView = ({ events, onEventClick }) => {
  const groups = useMemo(() => {
    const map = {};
    (events || []).forEach((ev) => {
      if (!ev?.start) return;
      const key = new Date(ev.start).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return Object.keys(map)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((key) => ({ date: new Date(key), events: map[key] }));
  }, [events]);

  if (!groups.length) {
    return (
      <div className="card-surface">
        <EmptyState
          icon={
            <Calendar className="h-7 w-7" />
          }
          title="No events in this period"
          description="Try a different range or clear your filters."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(({ date, events: dayEvents }) => {
        const today = isToday(date);
        const past = date.getTime() < startOfToday();
        return (
          <div key={date.toDateString()}>
            <div className="mb-2 flex items-center gap-2.5 px-1">
              <span className={`chip ring-1 ${today ? "bg-brand-600 text-white" : past ? "bg-ink-100 text-ink-500" : "bg-brand-50 text-brand-700 ring-brand-500/15"}`}>
                {today ? "Today" : relativeDayLabel(date)}
              </span>
              <span className="text-xs font-semibold text-ink-400">
                {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </span>
              <span className="h-px flex-1 bg-ink-200/60" />
              <span className="text-[11px] font-medium text-ink-400">{dayEvents.length}</span>
            </div>
            <div className="space-y-2">
              {dayEvents.map((ev) => (
                <AgendaEvent key={`${ev._id}-${ev.start}`} event={ev} onClick={onEventClick} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export default AgendaView;
