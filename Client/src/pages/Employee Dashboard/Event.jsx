import React, { useState } from "react";
import SideNavbar from "../../components/SideNavber";
import { NavLink } from "react-router-dom";
import arrowRight from "../../assets/material-symbols-light_arrow-back-rounded-1.svg";
import arrowLeft from "../../assets/material-symbols-light_arrow-back-rounded.svg";
import InfoBoxCard from "../../components/InfoBoxCard";
import EventCard from "../../components/EventCard";
import { useSelector } from "react-redux";

const Event = () => {
  const [ClickShow, setClickShow] = useState(true);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState("");
  const { user } = useSelector((state) => state.auth);
  console.log(user.user.role);

  const SideNav = (role) => {
    switch (role) {
      case "developer":
        return <SideNavbar />;
      case "HR Manager":
        return <HRSideNavber />;
      default:
        return null;
    }
  };

  const taskinfo = [
    {
      taskTitle: "Attendance Management",
      title: "Track Employee Work Hours",
      desc: "Allows employees to clock in at the start and clock out at the end of the workday.",
      datetime: "2025-04-08T09:00:00Z",
      read: false,
    },
    {
      taskTitle: "Attendance Management",
      title: "Break Management",
      desc: "Provides options to log break start and end times.",
      datetime: "2025-04-08T09:10:00Z",
      read: false,
    },
    {
      taskTitle: "Attendance Management",
      title: "Timestamp Logs",
      desc: "Records time for all actions to maintain accurate daily logs.",
      datetime: "2025-04-08T09:20:00Z",
      read: true,
    },
    {
      taskTitle: "UI/UX Improvements",
      title: "Simple UI",
      desc: "Clean, responsive interface for quick and intuitive interactions.",
      datetime: "2025-04-08T09:30:00Z",
      read: true,
    },
    {
      taskTitle: "Integration",
      title: "Dashboard Integration",
      desc: "Easily fits into existing company dashboards for attendance and reporting.",
      datetime: "2025-04-08T09:40:00Z",
      read: false,
    },
    {
      taskTitle: "User Management",
      title: "Add Employee",
      desc: "Form to register a new employee with role-based access.",
      datetime: "2025-04-08T10:00:00Z",
      read: false,
    },
    {
      taskTitle: "User Management",
      title: "Edit Employee Profile",
      desc: "Update employee info such as department and role.",
      datetime: "2025-04-08T10:15:00Z",
      read: true,
    },
    {
      taskTitle: "Task Tracker",
      title: "Create Task",
      desc: "Interface for assigning tasks to employees.",
      datetime: "2025-04-08T10:30:00Z",
      read: false,
    },
    {
      taskTitle: "Task Tracker",
      title: "Update Task Status",
      desc: "Allows employees to update progress of assigned tasks.",
      datetime: "2025-04-08T10:45:00Z",
      read: true,
    },
    {
      taskTitle: "Notifications",
      title: "Push Alerts",
      desc: "Send real-time updates for upcoming deadlines.",
      datetime: "2025-04-08T11:00:00Z",
      read: false,
    },
    {
      taskTitle: "Reports",
      title: "Daily Summary",
      desc: "Generate reports of attendance and tasks at day end.",
      datetime: "2025-04-08T11:15:00Z",
      read: true,
    },
    {
      taskTitle: "Reports",
      title: "Monthly Attendance",
      desc: "Graphical overview of attendance trends over the month.",
      datetime: "2025-04-08T11:30:00Z",
      read: true,
    },
    {
      taskTitle: "Meetings",
      title: "Schedule Meeting",
      desc: "Tool for organizing team meetings with notifications.",
      datetime: "2025-04-08T11:45:00Z",
      read: false,
    },
    {
      taskTitle: "Meetings",
      title: "Meeting Recap",
      desc: "Summarize key points and attendees of meetings.",
      datetime: "2025-04-08T12:00:00Z",
      read: true,
    },
    {
      taskTitle: "Security",
      title: "Two-Factor Authentication",
      desc: "Enable 2FA for added account protection.",
      datetime: "2025-04-08T12:15:00Z",
      read: false,
    },
    {
      taskTitle: "Security",
      title: "Password Reset",
      desc: "Allows users to securely reset their password.",
      datetime: "2025-04-08T12:30:00Z",
      read: true,
    },
    {
      taskTitle: "Event Management",
      title: "Create Company Event",
      desc: "Form to add internal or public company events.",
      datetime: "2025-04-08T12:45:00Z",
      read: false,
    },
    {
      taskTitle: "Event Management",
      title: "Send Invitations",
      desc: "Email and SMS invitation system for event guests.",
      datetime: "2025-04-08T13:00:00Z",
      read: false,
    },
    {
      taskTitle: "Performance Review",
      title: "Quarterly Review",
      desc: "Track and document employee performance every quarter.",
      datetime: "2025-04-08T13:15:00Z",
      read: true,
    },
    {
      taskTitle: "Performance Review",
      title: "Feedback Form",
      desc: "Anonymous feedback form for peer reviews.",
      datetime: "2025-04-08T13:30:00Z",
      read: false,
    },
  ];

  const uniqueTaskTitles = [...new Set(taskinfo.map((item) => item.taskTitle))];

  const filteredTasks = selectedTaskTitle
    ? taskinfo.filter((task) => task.taskTitle === selectedTaskTitle)
    : taskinfo;

  return (
    <div className="flex flex-row w-full">
      {SideNav(user.user.role)}
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
          <EventCard tasks={filteredTasks} />
        </div>
      </div>
    </div>
  );
};

export default Event;
