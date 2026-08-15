import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowRight,
  Bell,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarOff,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  MessageCircle,
  PartyPopper,
  Search,
  Settings,
  SquareCheck,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import { api } from "../utils/api";
import { ADMIN_ROLES } from "../Middlewares/roles";

const EMPLOYEE_KEYS = ["name", "email", "phone", "role", "employeeId"];

const PAGES = [
  { to: "/overview", label: "Dashboard", keywords: "dashboard overview home", icon: LayoutDashboard },
  { to: "/task", label: "Tasks", keywords: "task todo", icon: SquareCheck },
  { to: "/meeting", label: "Meetings", keywords: "meeting video call", icon: Video },
  { to: "/message", label: "Messages", keywords: "message chat", icon: MessageCircle },
  { to: "/calendar", label: "Calendar", keywords: "calendar schedule", icon: Calendar },
  { to: "/event", label: "Events", keywords: "event celebration", icon: PartyPopper },
  { to: "/attendance", label: "Attendance", keywords: "attendance clock in out", icon: CalendarCheck },
  { to: "/leaves", label: "Leaves", keywords: "leave vacation holiday", icon: CalendarOff },
  { to: "/search", label: "Search Employees", keywords: "search employee people staff", icon: Users },
  { to: "/notifications", label: "Notifications", keywords: "notification alerts bell", icon: Bell },
];

const ADMIN_PAGES = [
  { to: "/ats", label: "Applicant Tracking", keywords: "ats applicant resume candidate recruiting", icon: ClipboardList },
  { to: "/interviews", label: "Interviews", keywords: "interview panel scheduling", icon: Video },
  { to: "/EmployeeRegistration", label: "Employee Registration", keywords: "register new employee hire", icon: UserPlus },
  { to: "/job-postings", label: "Job Postings", keywords: "job vacancy posting", icon: Briefcase },
  { to: "/report", label: "Reports", keywords: "report export attendance", icon: FileText },
  { to: "/company-settings", label: "Company Settings", keywords: "settings company profile", icon: Settings },
];

const GlobalSearch = ({ open, onClose, onRequestOpen }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [empRes, meetRes, taskRes] = await Promise.allSettled([
          api.get("/emp/emp-get?limit=100"),
          api.get("/meeting?limit=50"),
          api.get("/task?limit=200"),
        ]);
        if (cancelled) return;
        setEmployees(empRes.status === "fulfilled" ? empRes.value?.data?.data?.data || [] : []);
        setMeetings(meetRes.status === "fulfilled" ? meetRes.value?.data?.data?.data || [] : []);
        setTasks(taskRes.status === "fulfilled" ? taskRes.value?.data?.data?.data || [] : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) onClose();
        else onRequestOpen();
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose, onRequestOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const out = [];
    const role = user?.user?.role;
    const pageList = [...PAGES, ...(ADMIN_ROLES.includes(role) ? ADMIN_PAGES : [])];

    for (const p of pageList) {
      if (`${p.label} ${p.keywords}`.toLowerCase().includes(q)) {
        out.push({
          id: `page-${p.to}`,
          group: "Pages",
          title: p.label,
          subtitle: "Open page",
          Icon: p.icon,
          onSelect: () => navigate(p.to),
        });
      }
    }

    for (const emp of employees) {
      const hay = EMPLOYEE_KEYS.map((k) => emp?.[k]).filter(Boolean).join(" ").toLowerCase();
      if (hay.includes(q)) {
        out.push({
          id: `emp-${emp._id}`,
          group: "Employees",
          title: emp.name || "Employee",
          subtitle: [emp.role, emp.employeeId, emp.email].filter(Boolean).join(" · "),
          Icon: Users,
          onSelect: () => navigate(`/search?q=${encodeURIComponent(emp.name || "")}`),
        });
      }
    }

    for (const m of meetings) {
      if (`${m.title || ""} ${m.meetingId || ""}`.toLowerCase().includes(q)) {
        out.push({
          id: `meet-${m._id}`,
          group: "Meetings",
          title: m.title || "Meeting",
          subtitle: [m.meetingId, m.status].filter(Boolean).join(" · "),
          Icon: Video,
          onSelect: () => navigate("/meeting"),
        });
      }
    }

    for (const t of tasks) {
      if (`${t.title || ""}`.toLowerCase().includes(q)) {
        out.push({
          id: `task-${t._id}`,
          group: "Tasks",
          title: t.title || "Task",
          subtitle: [t.priority, t.status, t.assignee?.name].filter(Boolean).join(" · "),
          Icon: SquareCheck,
          onSelect: () => navigate("/task"),
        });
      }
    }

    return out;
  }, [query, employees, meetings, tasks, navigate, user]);

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) {
        item.onSelect();
        onClose();
      }
    }
  };

  let lastGroup = null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm">
      <div className="card-surface w-full max-w-xl overflow-hidden shadow-modal animate-scale-in">
        <div className="flex items-center gap-3 border-b border-ink-200/70 px-4">
          <Search className="h-5 w-5 shrink-0 text-ink-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search employees, meetings, tasks, pages..."
            className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-ink-400"
            aria-label="Global search"
          />
          {loading ? (
            <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-brand-500" />
          ) : (
            <button
              onClick={onClose}
              aria-label="Close search"
              className="rounded-md p-1 text-ink-400 transition-colors hover:bg-ink-100/70 hover:text-ink-700 dark:hover:bg-white/10">
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="max-h-[52vh] overflow-y-auto scrollbar-thin py-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-400">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          ) : query.trim() === "" ? (
            <p className="py-10 text-center text-sm text-ink-400">
              Start typing to search across the app. Press{" "}
              <kbd className="rounded border border-ink-300 bg-surface-50 px-1.5 py-0.5 text-[11px] dark:border-ink-600 dark:bg-surface-800/50">
                Enter
              </kbd>{" "}
              to jump to the highlighted result.
            </p>
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-400">
              No results found for &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            results.map((item, index) => {
              const showHeader = item.group !== lastGroup;
              lastGroup = item.group;
              return (
                <Fragment key={item.id}>
                  {showHeader && (
                    <div className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">
                      {item.group}
                    </div>
                  )}
                  <button
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => {
                      item.onSelect();
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      index === activeIndex
                        ? "bg-brand-50 dark:bg-brand-500/15"
                        : "hover:bg-ink-100/70 dark:hover:bg-white/5"
                    }`}>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        index === activeIndex
                          ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                          : "bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-400"
                      }`}>
                      <item.Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-900 dark:text-ink-100">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-ink-400">{item.subtitle}</span>
                    </span>
                    {index === activeIndex && (
                      <ArrowRight className="h-4 w-4 shrink-0 text-brand-500" />
                    )}
                  </button>
                </Fragment>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-200/70 px-4 py-2.5 text-[11px] text-ink-400">
          <span>
            <kbd className="rounded border border-ink-300 bg-surface-50 px-1 py-0.5 dark:border-ink-600 dark:bg-surface-800/50">↑↓</kbd>{" "}
            Navigate
          </span>
          <span>
            <kbd className="rounded border border-ink-300 bg-surface-50 px-1 py-0.5 dark:border-ink-600 dark:bg-surface-800/50">Enter</kbd>{" "}
            Select
          </span>
          <span>
            <kbd className="rounded border border-ink-300 bg-surface-50 px-1 py-0.5 dark:border-ink-600 dark:bg-surface-800/50">Esc</kbd>{" "}
            Close
          </span>
          <span className="ml-auto">
            <kbd className="rounded border border-ink-300 bg-surface-50 px-1 py-0.5 dark:border-ink-600 dark:bg-surface-800/50">Ctrl</kbd>{" "}
            <kbd className="rounded border border-ink-300 bg-surface-50 px-1 py-0.5 dark:border-ink-600 dark:bg-surface-800/50">K</kbd>
          </span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
