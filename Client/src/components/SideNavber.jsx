import React from "react";
import { NavLink } from "react-router-dom";

const SideNavbar = () => {
  const navbarArr = [
    { name: "Overview", path: "/emp/overview" },
    { name: "Task", path: "/emp/task" },
    { name: "Message", path: "/emp/message" },
    { name: "Meeting", path: "/emp/meeting" },
    { name: "Attendance Info", path: "/emp/attendance" },
    { name: "Report", path: "/emp/report" },
    { name: "Event", path: "/emp/event" },
    { name: "Search Employees", path: "/emp/search" },
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

export default SideNavbar;
