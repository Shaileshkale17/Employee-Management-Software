import { useMemo } from "react";
import { getWeekDays, getHours, hourLabel, isToday, startOfDay, endOfDay } from "../../utils/dateUtils";
import { TYPE_META } from "./calendarMeta";

const HOUR_START = 0;
const HOUR_END = 23;
const MINUTES_IN_DAY = 24 * 60;

const position = (start, end) => {
  const s = new Date(start).getHours() * 60 + new Date(start).getMinutes();
  const e = Math.max(s + 15, new Date(end).getHours() * 60 + new Date(end).getMinutes());
  const top = (Math.max(s, 0) / MINUTES_IN_DAY) * 100;
  const height = (Math.min(e, MINUTES_IN_DAY) / MINUTES_IN_DAY) * 100 - (Math.max(s, 0) / MINUTES_IN_DAY) * 100;
  return { top: `${top}%`, height: `${Math.max(height, 1.4)}%` };
};

const AllDayEvent = ({ event, onClick }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick(event);
    }}
    className="w-full truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium"
    style={{ backgroundColor: `${event.category?.color || "#7C3AED"}1A`, color: event.category?.color || "#7C3AED" }}
    title={event.title}>
    {event.title}
  </button>
);

const TimedEvent = ({ event, onClick }) => {
  const { top, height } = position(event.start, event.end);
  const meta = TYPE_META[event.type] || TYPE_META.meeting;
  const color = event.category?.color || meta.dot;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      className="absolute left-0.5 right-0.5 overflow-hidden rounded-md border-l-2 px-1.5 py-0.5 text-left transition-all hover:z-10 hover:brightness-95"
      style={{ top, height, borderColor: color, backgroundColor: `${color}14` }}
      title={event.title}>
      <p className="truncate text-[10px] font-semibold" style={{ color }}>
        {event.title}
      </p>
      <p className="truncate text-[9px] text-ink-400">
        {new Date(event.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} –{" "}
        {new Date(event.end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </p>
    </button>
  );
};

const WeekView = ({ week, events, onEventClick, onSelectDay, onNewEventAt }) => {
  const days = useMemo(() => getWeekDays(week), [week]);
  const hours = useMemo(() => getHours(HOUR_START, HOUR_END), []);

  const byDay = useMemo(() => {
    const map = {};
    days.forEach((d) => {
      map[d.toDateString()] = { allDay: [], timed: [] };
    });
    events.forEach((ev) => {
      if (!ev?.start) return;
      days.forEach((d) => {
        const ds = startOfDay(d);
        const de = endOfDay(d);
        const s = new Date(ev.start);
        const e = ev.end ? new Date(ev.end) : new Date(s.getTime() + 60 * 60000);
        if (s <= de && e >= ds) {
          const bucket = ev.allDay ? "allDay" : "timed";
          map[d.toDateString()][bucket].push(ev);
        }
      });
    });
    Object.keys(map).forEach((k) => {
      map[k].timed.sort((a, b) => new Date(a.start) - new Date(b.start));
    });
    return map;
  }, [days, events]);

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-card">
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-ink-200/70 bg-surface-50/80">
        <div className="py-2.5 text-center text-[10px] text-ink-400" />
        {days.map((d) => {
          const today = isToday(d);
          return (
            <button
              key={d.toDateString()}
              type="button"
              onClick={() => onSelectDay(d)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors hover:bg-brand-50/40 ${today ? "bg-brand-50/60" : ""}`}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                {d.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${
                  today ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30" : "text-ink-700"
                }`}>
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[56px_repeat(7,1fr)]">
        <div className="border-r border-ink-200/50">
          {hours.map((h) => (
            <div key={h} className="relative h-12 border-b border-ink-200/40">
              <span className="absolute -top-2 right-2 text-[10px] font-medium text-ink-400">{hourLabel(h)}</span>
            </div>
          ))}
        </div>

        {days.map((d) => {
          const dayEvents = byDay[d.toDateString()];
          return (
            <div
              key={d.toDateString()}
              className="relative border-r border-ink-200/40"
              onDoubleClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const hour = Math.min(HOUR_END, Math.floor((y / rect.height) * 24));
                const date = new Date(d);
                date.setHours(hour, 0, 0, 0);
                onNewEventAt?.(date);
              }}>
              <div className={`sticky top-0 z-10 flex flex-col gap-0.5 border-b border-ink-200/50 p-1 ${isToday(d) ? "bg-brand-50/40 dark:bg-brand-600/40" : "bg-white/90 dark:bg-ink-200/90"}`}>
                {dayEvents.allDay.length > 0 ? (
                  dayEvents.allDay.map((ev) => <AllDayEvent key={`${ev._id}-${ev.start}`} event={ev} onClick={onEventClick} />)
                ) : (
                  <span className="text-[10px] text-ink-300">All day</span>
                )}
              </div>
              <div className="relative h-[24rem]">
                {hours.map((h) => (
                  <div key={h} className="absolute inset-x-0 border-t border-ink-200/30" style={{ top: `${(h / 24) * 100}%` }} />
                ))}
                {dayEvents.timed.map((ev) => (
                  <TimedEvent key={`${ev._id}-${ev.start}`} event={ev} onClick={onEventClick} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;
