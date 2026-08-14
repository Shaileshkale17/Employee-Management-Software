import { useMemo } from "react";
import { getHours, hourLabel, isToday, formatDate } from "../../utils/dateUtils";
import { TYPE_META } from "./calendarMeta";

const HOUR_START = 0;
const HOUR_END = 23;
const MINUTES_IN_DAY = 24 * 60;

const position = (start, end) => {
  const s = new Date(start).getHours() * 60 + new Date(start).getMinutes();
  const e = Math.max(s + 15, new Date(end).getHours() * 60 + new Date(end).getMinutes());
  const top = (Math.max(s, 0) / MINUTES_IN_DAY) * 100;
  const height = (Math.min(e, MINUTES_IN_DAY) / MINUTES_IN_DAY) * 100 - top;
  return { top: `${top}%`, height: `${Math.max(height, 1.4)}%` };
};

const DayView = ({ day, events, onEventClick, onNewEventAt }) => {
  const hours = useMemo(() => getHours(HOUR_START, HOUR_END), []);
  const today = isToday(day);

  const allDayEvents = useMemo(() => (events || []).filter((e) => e?.allDay), [events]);
  const timedEvents = useMemo(
    () => (events || []).filter((e) => !e?.allDay).sort((a, b) => new Date(a.start) - new Date(b.start)),
    [events]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-card">
      <div className={`flex items-center justify-between border-b border-ink-200/70 px-5 py-3 ${today ? "bg-brand-50/50" : "bg-surface-50/80"}`}>
        <div>
          <h3 className="text-sm font-bold text-ink-950">{formatDate(day, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</h3>
          <p className="text-xs text-ink-400 mt-0.5">
            {events?.length || 0} events · {allDayEvents.length} all-day
          </p>
        </div>
        {today && <span className="chip bg-brand-600 text-white">Today</span>}
      </div>

      {allDayEvents.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-ink-200/50 bg-surface-50/50 px-4 py-2.5">
          {allDayEvents.map((ev) => {
            const meta = TYPE_META[ev.type] || TYPE_META.meeting;
            const color = ev.category?.color || meta.dot;
            return (
              <button
                key={ev._id}
                type="button"
                onClick={() => onEventClick(ev)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all hover:brightness-95"
                style={{ backgroundColor: `${color}14`, color }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                {ev.title}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative h-[32rem] overflow-y-auto scrollbar-thin">
        {hours.map((h) => (
          <div key={h} className="relative h-12 border-t border-ink-200/40" onDoubleClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const minuteOffset = Math.max(0, Math.min(59, Math.floor((y / rect.height) * 60)));
            const date = new Date(day);
            date.setHours(h, minuteOffset, 0, 0);
            onNewEventAt?.(date);
          }}>
            <span className="absolute -top-2 left-3 text-[10px] font-medium text-ink-400">{hourLabel(h)}</span>
          </div>
        ))}
        {timedEvents.map((ev) => {
          const { top, height } = position(ev.start, ev.end);
          const meta = TYPE_META[ev.type] || TYPE_META.meeting;
          const color = ev.category?.color || meta.dot;
          return (
            <button
              key={`${ev._id}-${ev.start}`}
              type="button"
              onClick={() => onEventClick(ev)}
              className="absolute left-16 right-3 overflow-hidden rounded-lg border-l-2 px-2 py-1 text-left transition-all hover:z-10 hover:brightness-95"
              style={{ top, height, borderColor: color, backgroundColor: `${color}14` }}
              title={ev.title}>
              <p className="truncate text-xs font-semibold" style={{ color }}>{ev.title}</p>
              <p className="truncate text-[10px] text-ink-500">
                {new Date(ev.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} –{" "}
                {new Date(ev.end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DayView;
