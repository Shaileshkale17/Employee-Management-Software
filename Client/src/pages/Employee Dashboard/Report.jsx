import React, { useState } from "react";
import SideNavbar from "../../components/SideNavber";
import { NavLink } from "react-router-dom";
import arrowRight from "../../assets/material-symbols-light_arrow-back-rounded-1.svg";
import arrowLeft from "../../assets/material-symbols-light_arrow-back-rounded.svg";
import InfoBoxCard from "../../components/InfoBoxCard";
import InfoBoxCardDow from "../../components/download-icon.svg";

const Report = () => {
  const [ClickShow, setClickShow] = useState(true);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState("");

  const taskinfo = [
    {
      taskTitle: "Salary Report",
      title: "Track Employee Work Hours",
      desc: "Allows employees to clock in at the start and clock out at the end of the workday.",
      datetime: "2025-04-08T09:00:00Z",
      read: false,
    },
    {
      taskTitle: "Salary Report",
      title: "Break Management",
      desc: "Provides options to log break start and end times.",
      datetime: "2025-04-08T09:10:00Z",
      read: false,
    },
    {
      taskTitle: "Salary Report",
      title: "Timestamp Logs",
      desc: "Records time for all actions to maintain accurate daily logs.",
      datetime: "2025-04-08T09:20:00Z",
      read: true,
    },
    {
      taskTitle: "Salary Report",
      title: "Simple UI",
      desc: "Clean, responsive interface for quick and intuitive interactions.",
      datetime: "2025-04-08T09:30:00Z",
      read: true,
    },
    {
      taskTitle: "Salary Report",
      title: "Dashboard Integration",
      desc: "Easily fits into existing company dashboards for attendance and reporting.",
      datetime: "2025-04-08T09:40:00Z",
      read: false,
    },
  ];

  const uniqueTaskTitles = [...new Set(taskinfo.map((item) => item.taskTitle))];

  const filteredTasks = selectedTaskTitle
    ? taskinfo.filter((task) => task.taskTitle === selectedTaskTitle)
    : taskinfo;

  return (
    <div className="flex flex-row w-full">
      <SideNavbar />
      <div className="w-full flex h-screen">
        <div
          className={`relative ${
            ClickShow ? "w-[30%]" : "w-2"
          } p-4 min-h-svh overflow-y-auto space-y-4 transition-all duration-300`}>
          {ClickShow ? (
            <>
              <img
                src={arrowLeft}
                alt="collapse"
                onClick={() => setClickShow(false)}
                className="w-6 h-6 absolute right-2 top-2 cursor-pointer"
              />
              <ul className="flex flex-col gap-4 mt-8">
                {uniqueTaskTitles.map((title, index) => (
                  <li key={index}>
                    <button
                      onClick={() => setSelectedTaskTitle(title)}
                      className={`w-full text-start px-4 py-2 rounded-md transition-all ${
                        selectedTaskTitle === title
                          ? "bg-gray-700 text-white"
                          : "text-gray-800 hover:text-white hover:bg-gray-400"
                      }`}>
                      {title}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <img
              src={arrowRight}
              alt="expand"
              onClick={() => setClickShow(true)}
              className="w-6 h-6 absolute left-2 top-2 cursor-pointer"
            />
          )}
        </div>
        <div className="w-full p-4 overflow-y-auto">
          <InfoBoxCardDow tasks={filteredTasks} />
        </div>
      </div>
    </div>
  );
};

export default Report;
