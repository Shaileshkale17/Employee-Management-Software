import React from "react";
import { NavLink } from "react-router-dom";

const HRSideNavber = () => {
  const navbarArr = [
    { name: "Overview", path: "/overview" },
    { name: "Task", path: "/task" },
    { name: "Message", path: "/message" },
    { name: "Meeting", path: "/meeting" },
    { name: "Attendance Info", path: "/attendance" },
    { name: "Report", path: "/report" },
    { name: "Event", path: "/event" },
    { name: "Search Employees", path: "/search" },
    { name: "HR", path: "/search" },
  ];

  return (
    <div className="w-[30%] md:w-[20%] h-full bg-gray-100 p-1 md:p-4">
      <ul className="flex flex-col gap-4">
        {navbarArr.map((item, index) => (
          <li key={index}>
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
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HRSideNavber;
