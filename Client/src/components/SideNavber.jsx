import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  ChartColumn,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  SquareCheck,
  Users,
  Video,
  X,
} from "lucide-react";

const iconMap = {
  Overview: LayoutDashboard,
  Task: SquareCheck,
  Message: MessageSquare,
  Meeting: Video,
  Calendar: CalendarDays,
  "Attendance Info": CalendarCheck,
  Leaves: FileText,
  Report: ChartColumn,
  Event: Users,
  "Search Employees": Search,
  Notifications: Bell,
  "Company Settings": Settings,
};

const NavIcon = ({ name }) => {
  const Icon = iconMap[name] || iconMap.Overview;
  return <Icon className="h-[18px] w-[18px] shrink-0" />;
};

const sidebarItems = [
  { name: "Overview", path: "/overview" },
  { name: "Task", path: "/task" },
  { name: "Message", path: "/message" },
  { name: "Meeting", path: "/meeting" },
  { name: "Calendar", path: "/calendar" },
  { name: "Attendance Info", path: "/attendance" },
  { name: "Leaves", path: "/leaves" },
  { name: "Report", path: "/report" },
  { name: "Event", path: "/event" },
  { name: "Search Employees", path: "/search" },
  { name: "Notifications", path: "/notifications" },
];

const NavList = ({ onNavigate }) => (
  <ul className="space-y-1">
    {sidebarItems.map((item) => (
      <li key={item.path}>
        <NavLink
          to={item.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-smooth ${
              isActive
                ? "bg-brand-50 text-brand-700 font-semibold dark:bg-brand-200/15 dark:text-brand-100"
                : "text-ink-600 hover:text-ink-950 hover:bg-ink-100/70 dark:text-ink-400 dark:hover:text-ink-900 dark:hover:bg-white/5"
            }`
          }
        >
          <NavIcon name={item.name} />
          <span>{item.name}</span>
        </NavLink>
      </li>
    ))}
  </ul>
);

const SideNavbar = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-mobile-nav", handler);
    return () => window.removeEventListener("open-mobile-nav", handler);
  }, []);

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 z-[70] w-72 transform bg-surface-50 shadow-popover transition-transform duration-300 md:hidden dark:bg-surface-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex h-16 items-center justify-between border-b border-ink-200/60 px-4 dark:border-ink-700/40">
          <span className="text-sm font-bold text-ink-900">
            Menu
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-ink-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-[calc(100%-4rem)] overflow-y-auto p-3">
          <nav aria-label="Main navigation">
            <NavList onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-ink-950/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className="glass w-64 flex-shrink-0 border-r border-ink-200/60 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto scrollbar-thin hidden md:block">
        <nav className="p-3" aria-label="Main navigation">
          <NavList />
        </nav>
      </aside>
    </>
  );
};

export default SideNavbar;
