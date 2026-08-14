import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  ChartColumn,
  ChevronRight,
  DollarSign,
  FileText,
  Heart,
  LayoutDashboard,
  MessageCircle,
  MessageSquare,
  Search,
  Settings,
  SquareCheck,
  UserPlus,
  Users,
  Video,
  X,
  Zap,
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
  "Recruitment & Staffing": UserPlus,
  "Onboarding & Orientation": MessageCircle,
  "Employee Records & Documentation": FileText,
  "Payroll & Compensation": DollarSign,
  "Employee Benefits Administration": Heart,
  "Performance Management": Zap,
};

const NavIcon = ({ name }) => {
  const Icon = iconMap[name] || iconMap.Overview;
  return <Icon className="h-[18px] w-[18px] shrink-0" />;
};

const sidebarSections = [
  { name: "Overview", path: "/overview", icon: "Overview" },
  { name: "Task", path: "/task", icon: "Task" },
  { name: "Message", path: "/message", icon: "Message" },
  { name: "Meeting", path: "/meeting", icon: "Meeting" },
  { name: "Calendar", path: "/calendar", icon: "Calendar" },
  { name: "Attendance Info", path: "/attendance", icon: "Attendance Info" },
  { name: "Leaves", path: "/leaves", icon: "Leaves" },
  { name: "Report", path: "/report", icon: "Report" },
  { name: "Event", path: "/event", icon: "Event" },
  { name: "Search Employees", path: "/search", icon: "Search Employees" },
  { name: "Notifications", path: "/notifications", icon: "Notifications" },
  { name: "Company Settings", path: "/company-settings", icon: "Company Settings" },
  {
    name: "Recruitment & Staffing",
    icon: "Recruitment & Staffing",
    children: [
      { name: "Applicant Tracking (ATS)", path: "/ats" },
      { name: "Job Postings", path: "/job-postings" },
      { name: "Interview Scheduling", path: "/interviews" },
      { name: "Resume Screening", path: "/resume-screening" },
      { name: "Interview Scheduling & Coordination", path: "/interview-scheduling-coordination" },
      { name: "Conducting Interviews", path: "/conducting-interviews" },
    ],
  },
  {
    name: "Onboarding & Orientation",
    icon: "Onboarding & Orientation",
    children: [
      { name: "New employee orientation", path: "/new-employee-orientation" },
      { name: "Document verification", path: "/document-verification" },
      { name: "System access setup", path: "/system-access-setup" },
      { name: "Welcome kits", path: "/welcome-kits" },
    ],
  },
  {
    name: "Employee Records & Documentation",
    icon: "Employee Records & Documentation",
    children: [
      { name: "Maintaining employee files", path: "/Maintaining-employee-files" },
      { name: "Keeping records updated", path: "/keeping-records-updated" },
      { name: "Handling confidential information", path: "/Handling-confidential-information" },
    ],
  },
  {
    name: "Payroll & Compensation",
    icon: "Payroll & Compensation",
    children: [
      { name: "Managing salaries, bonuses, etc", path: "/managing-salaries-bonuses-and-incentives" },
      { name: "Coordinating with finance", path: "/coordinating-with-finance" },
      { name: "Attendance & leave tracking", path: "/Attendance-leave-tracking" },
    ],
  },
  {
    name: "Employee Benefits Administration",
    icon: "Employee Benefits Administration",
    children: [
      { name: "Health insurance", path: "/health-insurance" },
      { name: "Provident fund & gratuity", path: "/provident-fund-gratuity" },
      { name: "Other perks and reimbursements", path: "/other-perks-reimbursements" },
    ],
  },
  {
    name: "Performance Management",
    icon: "Performance Management",
    children: [
      { name: "Appraisal processes", path: "/appraisal-processes" },
      { name: "Goal setting", path: "/goal-setting" },
      { name: "Feedback collection", path: "/feedback-collection" },
      { name: "Promotions or terminations", path: "/promotions-terminations" },
    ],
  },
];

const ChevronIcon = ({ open }) => (
  <ChevronRight
    className={`h-4 w-4 text-ink-400 transition-transform duration-300 ease-smooth ${open ? "rotate-90" : ""}`}
  />
);

ChevronIcon.propTypes = {
  open: PropTypes.bool,
};

const NavList = ({ onNavigate }) => {
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (name) => {
    setOpenSections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
  <ul className="space-y-1">
    {sidebarSections.map((item) => (
      <li key={item.name}>
        {item.path ? (
          <NavLink
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-smooth ${
              isActive
                ? "bg-brand-50 text-brand-700 font-semibold dark:bg-brand-500/15 dark:text-brand-300"
                : "text-ink-600 hover:text-ink-950 hover:bg-ink-100/70 dark:text-ink-400 dark:hover:text-ink-100 dark:hover:bg-white/5"
              }`
            }>
            <NavIcon name={item.icon || item.name} />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ) : (
          <div>
            <button
              onClick={() => toggleSection(item.name)}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium text-ink-700 hover:text-ink-950 hover:bg-ink-100/70 transition-all duration-200 focus-ring dark:text-ink-300 dark:hover:text-ink-100 dark:hover:bg-white/5"
              aria-expanded={!!openSections[item.name]}>
              <span className="flex items-center gap-3 truncate">
                <NavIcon name={item.icon || item.name} />
                <span className="truncate">{item.name}</span>
              </span>
              <ChevronIcon open={!!openSections[item.name]} />
            </button>
            {openSections[item.name] && (
              <ul className="ml-4 mt-1 border-l-2 border-ink-200/70 pl-3 space-y-0.5">
                {item.children.map((sub) => (
                  <li key={sub.path}>
                    <NavLink
                      to={sub.path}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `block px-3 py-2 rounded-lg text-[13px] transition-all duration-200 ${
                          isActive
                            ? "bg-brand-50 text-brand-700 font-semibold dark:bg-brand-500/15 dark:text-brand-300"
                            : "text-ink-500 hover:text-ink-900 hover:bg-ink-100/70 dark:text-ink-400 dark:hover:text-ink-100 dark:hover:bg-white/5"
                        }`
                      }>
                      {sub.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </li>
    ))}
  </ul>
  );
};

const HRSideNavber = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMobileOpen(true);
    window.addEventListener("open-mobile-nav", handler);
    return () => window.removeEventListener("open-mobile-nav", handler);
  }, []);

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 z-[70] w-72 transform bg-white shadow-popover transition-transform duration-300 md:hidden dark:bg-ink-100 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}>
        <div className="flex h-16 items-center justify-between border-b border-ink-200/60 px-4">
          <span className="text-sm font-bold text-ink-900 dark:text-ink-100">Menu</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-ink-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-[calc(100%-4rem)] overflow-y-auto p-3">
          <nav aria-label="Main navigation">
            <NavList onNavigate={() => setMobileOpen(false)} />
          </nav>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-ink-950/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
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

export default HRSideNavber;
