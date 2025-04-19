import React, { useEffect, useState } from "react";
import SideNavbar from "../components/SideNavber";
import MeetingCard from "../components/MeetingCard";
import { useSelector } from "react-redux";

const Meeting = () => {
  const [selectedTaskTitle, setSelectedTaskTitle] = useState(null);
  const [Meet_Link, setMeet_Link] = useState("");
  const [DateValue, setDateValue] = useState("");
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

  const DateTime = () => {
    let newDate = new Date();

    let hours = newDate.getHours();
    let minutes = newDate.getMinutes();
    let Seconds = newDate.getSeconds();
    let todayDate = newDate.getDate();
    let month = newDate.getMonth() + 1;
    let year = newDate.getFullYear();
    let AMPM = "AM";
    if (hours >= 12) {
      AMPM = "PM";
    }
    return `${todayDate}/${month}/${year}${" "}${hours}:${minutes}:${Seconds} ${" "}  `;
  };
  setInterval(() => {
    setDateValue(DateTime());
  }, 1000);
  const TypeofMeet = [
    "Create meeting for Later",
    "Start an instant meeting",
    "Schedule your meeting",
  ];

  const meetings = [
    {
      taskTitle: "Salary Report",
      title: "Track Employee Work Hours",
      desc: "Allows employees to clock in at the start and clock out at the end of the workday.",
      datetime: "2025-04-08T09:00:00Z",
      read: false,
    },
    {
      taskTitle: "Monthly Review",
      title: "Team Performance Review",
      desc: "Monthly meeting to evaluate team performance and plan improvements.",
      datetime: "2025-04-10T14:00:00Z",
      read: false,
    },
    {
      taskTitle: "Client Meeting",
      title: "Project Update with Client",
      desc: "Discuss the progress of the current project and gather client feedback.",
      datetime: "2025-04-12T11:30:00Z",
      read: false,
    },
    {
      taskTitle: "Product Demo",
      title: "Demo New Features",
      desc: "Showcase the newly implemented features to internal stakeholders.",
      datetime: "2025-04-15T10:00:00Z",
      read: false,
    },
    {
      taskTitle: "Code Review",
      title: "Review Latest Merge Requests",
      desc: "Weekly session to go through the team's recent code submissions.",
      datetime: "2025-04-17T16:00:00Z",
      read: false,
    },
  ];

  return (
    <div className="flex flex-row w-full">
      {SideNav(user.user.role)}
      <div className="w-full min-h-[83.8vh] flex justify-center items-center bg-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl justify-center items-center">
          <div className="flex min-w-[60%] flex-col gap-4 justify-center h-full ">
            <h1 className="text-xl font-semibold text-center md:mb-16">
              {DateValue}
            </h1>
            <div className="flex flex-row  gap-5 flex-wrap">
              <select className="px-4 py-2 rounded-md shadow-md bg-white w-56">
                {TypeofMeet.map((item, i) => (
                  <option key={i} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <div>
                <input
                  type="text"
                  name="Meet_Link"
                  id="Meet_Link"
                  value={Meet_Link}
                  onChange={(e) => setMeet_Link(e.target.value)}
                  className="px-4 py-2 rounded-md shadow-md bg-white w-80 outline-none"
                  placeholder="Enter your code or Link"
                />
                <button
                  disabled={Meet_Link.trim() === ""}
                  className={`px-4 py-2 ml-2 bg-blue-500 text-white rounded-md shadow-md ${
                    Meet_Link.trim() === ""
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}>
                  Join
                </button>
              </div>
            </div>
          </div>
          <div className="min-w-[40%] p-4 bg-white rounded-lg shadow-md max-h-[75vh] overflow-y-auto">
            <MeetingCard
              tasks={meetings}
              selectedTaskTitle={selectedTaskTitle}
              setSelectedTaskTitle={setSelectedTaskTitle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meeting;
