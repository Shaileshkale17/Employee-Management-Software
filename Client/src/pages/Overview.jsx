import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import LineChart from "../components/LineChart";
import Card from "../components/Card";
import TitleCard from "../components/Title_Card";
import NotificationsList from "../components/NotificationsList";
import ClickInAndClickOut from "../components/clickInAndClickOut";
import StatCard from "../components/StatCard";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../utils/api";
import Meet from "../assets/guidance_meeting-room.svg";
import clear from "../assets/ic_baseline-clear.svg";
import light_check from "../assets/material-symbols-light_check-rounded.svg";
import calendar from "../assets/mdi_party-popper.svg";
import taskIcon from "../assets/grommet-icons_task.svg";
import report from "../assets/material-symbols-light_check-rounded.svg";

const formatEventDate = (value) => {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value || "";
    return d.toLocaleDateString();
  } catch {
    return value || "";
  }
};

const Overview = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.user?.role;
  const canManage = ["Company Admin", "HR", "HR Manager", "Recruiter"].includes(role);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!canManage) return;
    api.get("/company/stats").then((res) => setStats(res.data.data)).catch(() => {});
  }, [canManage]);

  useEffect(() => {
    api
      .get("/notification")
      .then((res) => setNotifications(res.data.data?.data || []))
      .catch((err) => console.error("Failed to fetch notifications:", err));
  }, []);

  useEffect(() => {
    api
      .get("/event/event-all")
      .then((res) => setEvents(res.data.data || []))
      .catch((err) => console.error("Failed to fetch events:", err));
  }, []);

  const SideNav = (r) => {
    if (r === "developer" || r === "Employee" || r === "Interviewer") return <SideNavbar />;
    if (canManage) return <HRSideNavber />;
    return null;
  };

  const featureCards = [
    { icon: Meet, title: "Meetings", description: "View all scheduled and past team meetings in one place.", link: "/meeting", status: "available" },
    { icon: clear, title: "Attendance", description: "Track employee attendance and generate reports.", link: "", status: "coming_soon" },
    { icon: light_check, title: "Smart Check-In", description: "Use QR code or face recognition for seamless attendance.", link: "", status: "coming_soon" },
    { icon: calendar, title: "Events", description: "Manage internal company events, birthdays, and celebrations.", link: "/event", status: "available" },
    { icon: taskIcon, title: "Task Board", description: "Assign, monitor, and complete tasks efficiently with Kanban view.", link: "/task", status: "available" },
    { icon: report, title: "Reports", description: "Generate detailed attendance, meeting, and productivity reports.", link: "", status: "coming_soon" },
  ];

  const Notifications = notifications.slice(0, 5).map((n) => ({
    title: n.title,
    message: n.message,
    type: n.type,
    timestamp: n.createdAt,
    isRead: n.status === "Read",
    link: n.link,
  }));

  const EventData = events.slice(0, 5).map((ev) => ({
    title: ev.title,
    date: formatEventDate(ev.StartDate),
    desc: ev.desc,
  }));

  const chartData = {
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

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true } },
      title: { display: true, text: "Meetings Held Each Month", color: "#374151", font: { size: 14, family: "Raleway" } },
    },
  };

  const employeesChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      { label: "Alice", data: [12, 15, 13, 17, 16, 18, 14], borderColor: "rgb(255, 99, 132)", fill: false, tension: 0.1 },
      { label: "Bob", data: [10, 11, 12, 13, 14, 15, 16], borderColor: "rgb(54, 162, 235)", fill: false, tension: 0.1 },
      { label: "Charlie", data: [8, 9, 7, 10, 12, 11, 9], borderColor: "rgb(255, 206, 86)", fill: false, tension: 0.1 },
    ],
  };

  const employeesChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true } },
      title: { display: true, text: "Monthly Meetings by Employees", color: "#374151", font: { size: 14, family: "Raleway" } },
    },
  };

  return (
    <div className="flex">
      {SideNav(role)}
      <main className="flex-1 min-h-screen p-4 lg:p-6 space-y-6">
        {canManage && (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
              <StatCard label="Total Employees" value={stats?.employees ?? "—"} color="blue" />
              <StatCard label="Active Jobs" value={stats?.activeJobs ?? "—"} color="green" />
              <StatCard label="Total Applicants" value={stats?.candidates ?? "—"} color="purple" />
              <StatCard label="Applications" value={stats?.applications ?? "—"} color="indigo" />
              <StatCard label="Upcoming Interviews" value={stats?.upcomingInterviews ?? "—"} color="amber" />
            </div>
            <div className="flex flex-wrap gap-3 mb-2">
              <Link to="/ats" className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:border-brand-300 hover:text-brand-600 transition-colors">
                ATS Dashboard
              </Link>
              <Link to="/interviews" className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:border-brand-300 hover:text-brand-600 transition-colors">
                Schedule Interviews
              </Link>
              <Link to="/job-postings" className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:border-brand-300 hover:text-brand-600 transition-colors">
                Job Postings
              </Link>
              <Link to="/notifications" className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:border-brand-300 hover:text-brand-600 transition-colors">
                Notifications
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hidden lg:block">
            <LineChart data={chartData} options={chartOptions} />
          </Card>
          <Card className="hidden lg:block">
            <LineChart data={employeesChartData} options={employeesChartOptions} />
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {featureCards.map((item, idx) => (
              <TitleCard key={idx} {...item} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              Upcoming Events
            </h3>
            <div className="max-h-[280px] overflow-y-auto space-y-2 scrollbar-thin pr-1">
              {EventData.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No upcoming events</p>
              ) : (
                EventData.map((event, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-gray-200 transition-all duration-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{event.title}</h3>
                    <p className="text-xs text-gray-500 mb-1">{event.date}</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{event.desc}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Notifications
            </h3>
            <div className="max-h-[280px] overflow-y-auto space-y-2 scrollbar-thin pr-1">
              {Notifications.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No notifications</p>
              ) : (
                Notifications.map((not, idx) => (
                  <NotificationsList key={idx} {...not} />
                ))
              )}
            </div>
          </Card>
          <Card>
            <ClickInAndClickOut />
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Overview;
