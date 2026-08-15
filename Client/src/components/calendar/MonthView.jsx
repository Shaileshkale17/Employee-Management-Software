import { useMemo } from "react";
import { getMonthGrid, isSameMonth, isToday, getOverlap, weekdayShort } from "../../utils/dateUtils";
import { TYPE_META } from "./calendarMeta";

const MAX_CHIPS = 3;

const compactTime = (d) => {
  const date = new Date(d);
  const h = date.getHours();
  const m = date.getMinutes();
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = ((h + 11) % 12) + 1;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
};

const timeRange = (start, end) => {
  if (!start) return "";
  if (!end || new Date(end) <= new Date(start)) return compactTime(start);
  return `${compactTime(start)}–${compactTime(end)}`;
};

const EventChip = ({ event, onClick }) => {
  const meta = TYPE_META[event.type] || TYPE_META.meeting;
  const time = timeRange(event.start, event.end);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      className="group flex w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium transition-all hover:brightness-95"
      style={{ backgroundColor: `${event.category?.color || meta.dot}1A`, color: event.category?.color || meta.dot }}
      title={`${event.title}${time ? ` · ${time}` : ""}`}>
      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: event.category?.color || meta.dot }} />
      <span className="truncate">{event.title}</span>
      {time && (
        <span className="ml-auto flex-shrink-0 rounded bg-white/60 px-1 text-[9px] font-semibold leading-3 opacity-80">
          {time}
        </span>
      )}
    </button>
  );
};

const DayCell = ({ date, events, inMonth, onSelectDay, onEventClick }) => {
  const today = isToday(date);
  return (
    <div
      onClick={() => onSelectDay(date)}
      className={`group relative flex min-h-[108px] flex-col gap-0.5 border-t border-r border-ink-200/50 p-1.5 transition-colors focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand-500/40 ${
        inMonth ? "bg-white hover:bg-brand-50/40 dark:bg-white/5 dark:hover:bg-brand-500/10" : "bg-surface-50/60 hover:bg-brand-50/30 dark:bg-white/5 dark:hover:bg-brand-500/10"
      } ${today ? "!bg-brand-50/50" : ""}`}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectDay(date);
          }}
          aria-label={`Select ${date.toDateString()}`}
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors focus-ring ${
            today ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30" : inMonth ? "text-ink-700" : "text-ink-300"
          }`}>
          {date.getDate()}
        </button>
        {events.length > 0 && <span className="text-[10px] font-medium text-ink-400">{events.length}</span>}
      </div>
      <div className="flex flex-col gap-0.5 overflow-hidden">
        {events.slice(0, MAX_CHIPS).map((ev) => (
          <EventChip key={`${ev._id}-${ev.start}`} event={ev} onClick={onEventClick} />
        ))}
        {events.length > MAX_CHIPS && (
          <span className="px-1.5 text-[11px] font-semibold text-brand-600">
            +{events.length - MAX_CHIPS} more
          </span>
        )}
      </div>
    </div>
  );
};

const MonthView = ({ month, events, onSelectDay, onEventClick }) => {
  const grid = useMemo(() => getMonthGrid(month), [month]);

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (!ev?.start) return;
      grid.forEach((day) => {
        if (getOverlap(ev, day)) {
          const key = day.toDateString();
          if (!map[key]) map[key] = [];
          map[key].push(ev);
        }
      });
    });
    Object.keys(map).forEach((k) => map[k].sort((a, b) => new Date(a.start) - new Date(b.start)));
    return map;
  }, [events, grid]);

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-card dark:bg-white/5 dark:border-ink-700/40">
      <div className="grid grid-cols-7 border-b border-ink-200/70 bg-surface-50/80">
        {weekdayShort.map((d) => (
          <div key={d} className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.map((day) => (
          <DayCell
            key={day.toISOString()}
            date={day}
            events={eventsByDay[day.toDateString()] || []}
            inMonth={isSameMonth(day, month)}
            onSelectDay={onSelectDay}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  );
};

export default MonthView;
