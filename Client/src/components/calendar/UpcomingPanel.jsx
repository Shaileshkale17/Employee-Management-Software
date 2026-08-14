import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Bell, Cake, CircleCheck, Flag, Sparkles, Sun, TriangleAlert, Users, Video } from "lucide-react";
import { loadUpcomingPanel } from "../../redux/slices/calendarSlice";
import Skeleton from "../Skeleton";
import { TYPE_META } from "./calendarMeta";
import { formatTime, relativeDayLabel } from "../../utils/dateUtils";
import { openMeetingLink } from "../../utils/meetingPlatforms";

const GROUP_META = {
  meetings: { label: "Meetings", color: "#7C3AED" },
  interviews: { label: "Interviews", color: "#6366F1" },
  events: { label: "Events", color: "#0EA5E9" },
  holidays: { label: "Holidays", color: "#F43F5E" },
  birthdays: { label: "Birthdays", color: "#EC4899" },
  companyEvents: { label: "Company events", color: "#F59E0B" },
  deadlines: { label: "Deadlines", color: "#EA580C" },
  tasks: { label: "Tasks", color: "#10B981" },
  reminders: { label: "Reminders", color: "#64748B" },
  importantDates: { label: "Important dates", color: "#DC2626" },
};

const GROUP_ORDER = ["meetings", "interviews", "events", "holidays", "birthdays", "companyEvents", "deadlines", "tasks", "reminders", "importantDates"];

const ItemIcon = ({ type }) => {
  const meta = TYPE_META[type] || TYPE_META.meeting;
  const icons = {
    video: Video,
    users: Users,
    sparkles: Sparkles,
    bell: Bell,
    check: CircleCheck,
    cake: Cake,
    sun: Sun,
    flag: Flag,
    alert: TriangleAlert,
  };
  const Icon = icons[meta.icon] || icons.bell;
  return <Icon className="h-4 w-4" />;
};

const PanelItem = ({ item, onClick }) => {
  const meta = TYPE_META[item.type] || TYPE_META.meeting;
  const color = item.color || item.category?.color || meta.dot;
  return (
    <div
      onClick={() => onClick?.(item)}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(item);
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`group flex items-start gap-3 rounded-xl border border-ink-200/50 bg-white px-3 py-2.5 transition-all duration-300 ease-smooth focus-ring hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover dark:bg-white/5 dark:border-ink-700/40 ${
        onClick ? "cursor-pointer" : ""
      }`}>
      <span
        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: color }}>
        <ItemIcon type={item.type} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="min-w-0 truncate text-sm font-semibold text-ink-900">{item.title}</p>
          {item.isToday && <span className="chip flex-shrink-0 bg-brand-600 text-white">Today</span>}
        </div>
        {item.subtitle && <p className="mt-0.5 truncate text-xs text-ink-400">{item.subtitle}</p>}
        <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-400">
          <span className="font-medium text-brand-600">{relativeDayLabel(item.start)}</span>
          {item.start && !item.allDay && <span>· {formatTime(item.start)}</span>}
          {item.meetingLink && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openMeetingLink(item.meetingLink);
              }}
              className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold text-brand-600 transition-colors hover:bg-brand-50">
              <Video className="h-3 w-3" />
              Join
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const UpcomingPanel = ({ onEventClick, limit }) => {
  const dispatch = useDispatch();
  const { upcomingPanel, panelLoading } = useSelector((state) => state.calendar);

  useEffect(() => {
    dispatch(loadUpcomingPanel());
  }, [dispatch]);

  const renderGroups = () =>
    GROUP_ORDER.map((key) => {
      const items = upcomingPanel[key] || [];
      if (items.length === 0) return null;
      const meta = GROUP_META[key];
      const visible = limit ? items.slice(0, limit) : items;
      return (
        <section key={key}>
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-500">{meta.label}</h4>
            <span className="text-[11px] font-medium text-ink-400">{items.length}</span>
          </div>
          <div className="space-y-2">
            {visible.map((item) => (
              <PanelItem key={item.key} item={item} onClick={onEventClick} />
            ))}
          </div>
        </section>
      );
    });

  return (
    <div className="card-surface p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-900">Upcoming</h3>
        <span className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-500/15">30 days</span>
      </div>
      {panelLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton variant="circle" className="h-8 w-8" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">{renderGroups()}</div>
      )}
    </div>
  );
};

export default UpcomingPanel;
