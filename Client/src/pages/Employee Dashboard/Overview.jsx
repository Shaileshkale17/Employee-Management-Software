import React from "react";
import SideNavbar from "../../components/SideNavber";
import LineChart from "../../components/LineChart";
import Card from "../../components/Card";
import Title_Card from "../../components/Title_Card";

import Meet from "../../assets/guidance_meeting-room.svg";
import clear from "../../assets/ic_baseline-clear.svg";
import light_check from "../../assets/material-symbols-light_check-rounded.svg";
import calendar from "../../assets/mdi_party-popper.svg";
import task from "../../assets/grommet-icons_task.svg";
import report from "../../assets/material-symbols-light_check-rounded.svg";
import EventList from "../../components/EventList";
import NotificationsList from "../../components/NotificationsList";
import ClickInAndClickOut from "../../components/clickInAndClickOut";

const Overview = () => {
  const featureCards = [
    {
      icon: Meet,
      title: "Meetings",
      description: "View all scheduled and past team meetings in one place.",
      link: "/meeting",
      status: "available",
    },
    {
      icon: clear,
      title: "Attendance",
      description: "Track employee attendance and generate reports.",
      link: "",
      status: "coming_soon",
    },
    {
      icon: light_check,
      title: "Smart Check-In",
      description: "Use QR code or face recognition for seamless attendance.",
      link: "",
      status: "coming_soon",
    },
    {
      icon: calendar,
      title: "Events",
      description:
        "Manage internal company events, birthdays, and celebrations.",
      link: "/event",
      status: "available",
    },
    {
      icon: task,
      title: "Task Board",
      description:
        "Assign, monitor, and complete tasks efficiently with Kanban view.",
      link: "/task",
      status: "available",
    },
    {
      icon: report,
      title: "Reports",
      description:
        "Generate detailed attendance, meeting, and productivity reports.",
      link: "",
      status: "coming_soon",
    },
  ];

  const Notifications = [
    {
      id: 1,
      title: "New Task Assigned",
      message: "You have been assigned to the 'UI Redesign' task.",
      type: "task",
      timestamp: "2025-04-06T10:45:00Z",
      isRead: false,
      link: "/tasks/42",
    },
    {
      id: 2,
      title: "Meeting Reminder",
      message: "Team standup starts at 11:00 AM.",
      type: "meeting",
      timestamp: "2025-04-06T09:30:00Z",
      isRead: false,
      link: "/meetings/weekly-standup",
    },
    {
      id: 3,
      title: "Attendance Update",
      message: "Your attendance for April 5th has been marked.",
      type: "attendance",
      timestamp: "2025-04-05T18:00:00Z",
      isRead: true,
      link: "/attendance",
    },
    {
      id: 4,
      title: "System Alert",
      message: "Server maintenance scheduled for April 8th at 2:00 AM.",
      type: "alert",
      timestamp: "2025-04-05T17:00:00Z",
      isRead: false,
      link: "/notifications",
    },
    {
      id: 5,
      title: "New Message",
      message: "You received a message from HR.",
      type: "message",
      timestamp: "2025-04-06T07:20:00Z",
      isRead: false,
      link: "/messages/hr",
    },
  ];

  const EventData = [
    {
      id: 1,
      title: "Team Standup Meeting",
      date: "2025-04-08",
      time: "10:00 AM",
      description: "Daily sync-up meeting with the development team.",
      organizer: "Alice Johnson",
      type: "Meeting",
      status: "Upcoming",
    },
    {
      id: 2,
      title: "Product Demo",
      date: "2025-04-10",
      time: "3:00 PM",
      description: "Live demo of the new feature for internal stakeholders.",
      organizer: "Bob Smith",
      type: "Presentation",
      status: "Upcoming",
    },
    {
      id: 3,
      title: "Birthday Celebration - Charlie",
      date: "2025-04-12",
      time: "5:00 PM",
      description: "Celebrate Charlie's birthday in the cafeteria.",
      organizer: "HR Team",
      type: "Celebration",
      status: "Upcoming",
    },
    {
      id: 4,
      title: "Annual Townhall",
      date: "2025-03-25",
      time: "11:00 AM",
      description:
        "Company-wide meeting to discuss annual goals and achievements.",
      organizer: "CEO Office",
      type: "Townhall",
      status: "Completed",
    },
    {
      id: 5,
      title: "Tech Talk: AI in 2025",
      date: "2025-04-15",
      time: "2:00 PM",
      description: "An internal tech session on how AI is shaping our tools.",
      organizer: "Dev Team",
      type: "Tech Talk",
      status: "Upcoming",
    },
  ];

  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Meetings",
        data: [65, 59, 80, 81, 56, 55, 40],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Meetings Held Each Month" },
    },
  };

  const employees_data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Alice",
        data: [12, 15, 13, 17, 16, 18, 14],
        borderColor: "rgb(255, 99, 132)",
        fill: false,
        tension: 0.1,
      },
      {
        label: "Bob",
        data: [10, 11, 12, 13, 14, 15, 16],
        borderColor: "rgb(54, 162, 235)",
        fill: false,
        tension: 0.1,
      },
      {
        label: "Charlie",
        data: [8, 9, 7, 10, 12, 11, 9],
        borderColor: "rgb(255, 206, 86)",
        fill: false,
        tension: 0.1,
      },
    ],
  };

  const employees_options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Monthly Meetings by Employees" },
    },
  };

  return (
    <div className="flex flex-row w-full">
      <SideNavbar />
      <main className="w-full min-h-screen grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 bg-white">
        <div className="flex justify-center items-center rounded-lg shadow-md p-4">
          <LineChart data={data} options={options} />
        </div>
        <div className="flex justify-center items-center rounded-lg shadow-md p-4">
          <LineChart data={employees_data} options={employees_options} />
        </div>

        <Card>
          <div className="grid grid-cols-3 gap-4">
            {featureCards.map((item, idx) => (
              <Title_Card
                key={idx}
                icon={item.icon}
                title={item.title}
                description={item.description}
                link={item.link}
                status={item.status}
              />
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex flex-col max-h-[200px] overflow-y-auto space-y-4 pr-2">
            {EventData.map((event, idx) => (
              <EventList key={idx} {...event} />
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex flex-col max-h-[200px] overflow-y-auto space-y-4 pr-2">
            {Notifications.map((not, idx) => (
              <NotificationsList key={idx} {...not} />
            ))}
          </div>
        </Card>
        <Card>
          <ClickInAndClickOut />
        </Card>
      </main>
    </div>
  );
};

export default Overview;
