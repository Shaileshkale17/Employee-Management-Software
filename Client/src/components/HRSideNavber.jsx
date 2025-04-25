import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const HRSideNavber = () => {
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (SectionName) => {
    setOpenSections((pre) => ({ ...pre, [SectionName]: !pre[SectionName] }));
  };

  const navbarArr = [
    { name: "Overview", path: "/overview" },
    { name: "Task", path: "/task" },
    { name: "Message", path: "/message" },
    { name: "Meeting", path: "/meeting" },
    { name: "Attendance Info", path: "/attendance" },
    { name: "Report", path: "/report" },
    { name: "Event", path: "/event" },
    { name: "Search Employees", path: "/search" },
    {
      name: "Recruitment & Staffing",
      inArray: [
        { name: "Job Postings", path: "/job-postings" },
        { name: "Resume Screening", path: "/resume-screening" },
        {
          name: "Interview Scheduling & Coordination",
          path: "/interview-scheduling-coordination",
        },
        { name: "Conducting Interviews", path: "/conducting-interviews" },
        { name: "Conducting Interviews", path: "/conducting-interviews" },
      ],
    },
    {
      name: "Onboarding & Orientation",
      inArray: [
        { name: "New employee orientation", path: "/new-employee-orientation" },
        { name: "Document verification", path: "/document-verification" },
        { name: "System access setup", path: "/system-access-setup" },
        { name: "Welcome kits", path: "/welcome-kits" },
      ],
    },
    {
      name: "Employee Records & Documentation",
      inArray: [
        {
          name: "Maintaining employee files",
          path: "/Maintaining-employee-files",
        },
        { name: "Keeping records updated", path: "/keeping-records-updated" },
        {
          name: "Handling confidential information",
          path: "/Handling-confidential-information",
        },
      ],
    },
    {
      name: "Payroll & Compensation",
      inArray: [
        {
          name: "Managing salaries, bonuses, etc",
          path: "/managing-salaries-bonuses-and-incentives",
        },
        {
          name: "Coordinating with finance",
          path: "/coordinating-with-finance",
        },
        {
          name: "Attendance & leave tracking",
          path: "/Attendance-leave-tracking",
        },
      ],
    },
    {
      name: "Employee Benefits Administration",
      inArray: [
        {
          name: "Health insurance",
          path: "/health-insurance",
        },
        {
          name: "Provident fund & gratuity",
          path: "/provident-fund-gratuity",
        },
        {
          name: "Other perks and reimbursements",
          path: "/other-perks-reimbursements",
        },
      ],
    },
    {
      name: "Performance Management",
      inArray: [
        {
          name: "Appraisal processes",
          path: "/appraisal-processes",
        },
        {
          name: "Goal setting",
          path: "/goal-setting",
        },
        {
          name: "Feedback collection",
          path: "/feedback-collection",
        },
        {
          name: "Promotions or terminations",
          path: "/pvromotions-terminations",
        },
      ],
    },
  ];

  return (
    <div className="w-[30%] md:w-[20%] h-screen bg-gray-100 p-1 md:p-4 overflow-y-scroll ">
      <ul className="flex flex-col gap-4">
        {navbarArr.map((item, index) => (
          <li key={index}>
            {item.path ? (
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `block md:px-4 py-2 rounded-md text-start transition-all ${
                    isActive
                      ? "bg-gray-700 text-white"
                      : "text-gray-800 hover:text-white hover:bg-gray-400"
                  }`
                }>
                {item.name}
              </NavLink>
            ) : (
              <div>
                <button
                  onClick={() => toggleSection(item.name)}
                  className={`w-full lg:px-4 py-2 text-left font-semibold text-gray-700 hover:bg-gray-300 rounded-md`}>
                  {item.name}
                </button>
                {openSections[item.name] && (
                  <ul className="pl-6 flex flex-col gap-2 mt-2">
                    {item.inArray.map((subItem, subIndex) => (
                      <li key={subIndex}>
                        <NavLink
                          to={subItem.path}
                          className={({ isActive }) =>
                            `block py-1 px-3 rounded text-sm transition-all ${
                              isActive
                                ? "bg-gray-700 text-white"
                                : "text-gray-600 hover:text-white hover:bg-gray-400"
                            }`
                          }>
                          {subItem.name}
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
    </div>
  );
};

export default HRSideNavber;
