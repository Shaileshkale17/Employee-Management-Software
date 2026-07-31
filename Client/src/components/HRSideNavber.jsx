import { useState } from "react";
import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";

const sidebarSections = [
  { name: "Overview", path: "/overview" },
  { name: "Task", path: "/task" },
  { name: "Message", path: "/message" },
  { name: "Meeting", path: "/meeting" },
  { name: "Attendance Info", path: "/attendance" },
  { name: "Leaves", path: "/leaves" },
  { name: "Report", path: "/report" },
  { name: "Event", path: "/event" },
  { name: "Search Employees", path: "/search" },
  { name: "Notifications", path: "/notifications" },
  { name: "Company Settings", path: "/company-settings" },
  {
    name: "Recruitment & Staffing",
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
    children: [
      { name: "New employee orientation", path: "/new-employee-orientation" },
      { name: "Document verification", path: "/document-verification" },
      { name: "System access setup", path: "/system-access-setup" },
      { name: "Welcome kits", path: "/welcome-kits" },
    ],
  },
  {
    name: "Employee Records & Documentation",
    children: [
      { name: "Maintaining employee files", path: "/Maintaining-employee-files" },
      { name: "Keeping records updated", path: "/keeping-records-updated" },
      { name: "Handling confidential information", path: "/Handling-confidential-information" },
    ],
  },
  {
    name: "Payroll & Compensation",
    children: [
      { name: "Managing salaries, bonuses, etc", path: "/managing-salaries-bonuses-and-incentives" },
      { name: "Coordinating with finance", path: "/coordinating-with-finance" },
      { name: "Attendance & leave tracking", path: "/Attendance-leave-tracking" },
    ],
  },
  {
    name: "Employee Benefits Administration",
    children: [
      { name: "Health insurance", path: "/health-insurance" },
      { name: "Provident fund & gratuity", path: "/provident-fund-gratuity" },
      { name: "Other perks and reimbursements", path: "/other-perks-reimbursements" },
    ],
  },
  {
    name: "Performance Management",
    children: [
      { name: "Appraisal processes", path: "/appraisal-processes" },
      { name: "Goal setting", path: "/goal-setting" },
      { name: "Feedback collection", path: "/feedback-collection" },
      { name: "Promotions or terminations", path: "/pvromotions-terminations" },
    ],
  },
];

const ChevronIcon = ({ open }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

ChevronIcon.propTypes = {
  open: PropTypes.bool,
};

const HRSideNavber = () => {
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (name) => {
    setOpenSections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto scrollbar-thin">
      <nav className="p-3">
        <ul className="space-y-1">
          {sidebarSections.map((item) => (
            <li key={item.name}>
              {item.path ? (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`
                  }>
                  {item.name}
                </NavLink>
              ) : (
                <div>
                  <button
                    onClick={() => toggleSection(item.name)}
                    className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                    aria-expanded={!!openSections[item.name]}>
                    <span>{item.name}</span>
                    <ChevronIcon open={!!openSections[item.name]} />
                  </button>
                  {openSections[item.name] && (
                    <ul className="ml-3 mt-1 border-l border-gray-200 pl-3 space-y-0.5">
                      {item.children.map((sub) => (
                        <li key={sub.path}>
                          <NavLink
                            to={sub.path}
                            className={({ isActive }) =>
                              `block px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                isActive
                                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
                                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
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
      </nav>
    </aside>
  );
};

export default HRSideNavber;
