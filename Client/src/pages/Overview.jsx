import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import LineChart from "../components/LineChart";
import Card from "../components/Card";
import TitleCard from "../components/Title_Card";
import NotificationsList from "../components/NotificationsList";
import ClickInAndClickOut from "../components/clickInAndClickOut";
import StatCard from "../components/StatCard";
import CalendarWidget from "../components/calendar/CalendarWidget";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../utils/api";
import { ArrowUpRight, Bell, Briefcase, Calendar, CalendarDays, Check, CircleCheck, FileText, GraduationCap, ListTodo, PartyPopper, Users, Video, X } from "lucide-react";

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
  const isDark = useSelector((state) => state.theme?.mode === "dark");
  const role = user?.user?.role;
  const canManage = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(role);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [events, setEvents] = useState([]);
  const [meetingAnalytics, setMeetingAnalytics] = useState(null);
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState(null);

  useEffect(() => {
    if (!canManage) return;
    api.get("/company/stats").then((res) => setStats(res.data.data)).catch(() => {});
  }, [canManage]);

  useEffect(() => {
    api.get("/meeting/analytics").then((res) => setMeetingAnalytics(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!canManage) return;
    api.get("/attendance/today-summary").then((res) => setAttendanceToday(res.data.data)).catch(() => {});
    api.get("/leave", { params: { status: "Pending", limit: 1 } }).then((res) => setPendingLeaves(res.data.data?.total || 0)).catch(() => {});
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
    { icon: <Video className="h-6 w-6" />, title: "Meetings", description: "View all scheduled and past team meetings in one place.", link: "/meeting", status: "available" },
    { icon: <X className="h-6 w-6" />, title: "Attendance", description: "Track employee attendance and generate reports.", link: "", status: "coming_soon" },
    { icon: <CircleCheck className="h-6 w-6" />, title: "Smart Check-In", description: "Use QR code or face recognition for seamless attendance.", link: "", status: "coming_soon" },
    { icon: <PartyPopper className="h-6 w-6" />, title: "Events", description: "Manage internal company events, birthdays, and celebrations.", link: "/event", status: "available" },
    { icon: <ListTodo className="h-6 w-6" />, title: "Task Board", description: "Assign, monitor, and complete tasks efficiently with Kanban view.", link: "/task", status: "available" },
    { icon: <Check className="h-6 w-6" />, title: "Reports", description: "Generate detailed attendance, meeting, and productivity reports.", link: "", status: "coming_soon" },
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
    labels: (meetingAnalytics?.byMonth || []).map((m) => m.month),
    datasets: [
      {
        label: "Meetings",
        data: (meetingAnalytics?.byMonth || []).map((m) => m.count),
        borderColor: "#7C3AED",
        backgroundColor: "rgba(124, 58, 237, 0.12)",
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "#7C3AED",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: { usePointStyle: true, pointStyle: "circle", color: isDark ? "#94A3B8" : "#71717A", font: { size: 11, family: "Inter", weight: 600 } },
      },
      title: {
        display: false,
        text: "Meetings Held Each Month",
        color: isDark ? "#E2E8F0" : "#18181B",
        font: { size: 14, family: "Inter", weight: 600 },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: isDark ? "#94A3B8" : "#A1A1AA", font: { size: 11 } } },
      y: {
        beginAtZero: true,
        grid: { color: isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(13, 17, 28, 0.06)" },
        ticks: { color: isDark ? "#94A3B8" : "#A1A1AA", font: { size: 11 } },
      },
    },
  };

  const employeesChartData = {
    labels: (meetingAnalytics?.byEmployee || []).map((e) => e.name),
    datasets: [
      {
        label: "Meetings",
        data: (meetingAnalytics?.byEmployee || []).map((e) => e.count),
        borderColor: "#A78BFA",
        backgroundColor: "rgba(167, 139, 250, 0.12)",
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "#A78BFA",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const employeesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: { usePointStyle: true, pointStyle: "circle", color: isDark ? "#94A3B8" : "#71717A", font: { size: 11, family: "Inter", weight: 600 } },
      },
      title: {
        display: false,
        text: "Monthly Meetings by Employees",
        color: isDark ? "#E2E8F0" : "#18181B",
        font: { size: 14, family: "Inter", weight: 600 },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: isDark ? "#94A3B8" : "#A1A1AA", font: { size: 11 } } },
      y: {
        beginAtZero: true,
        grid: { color: isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(13, 17, 28, 0.06)" },
        ticks: { color: isDark ? "#94A3B8" : "#A1A1AA", font: { size: 11 } },
      },
    },
  };

  const quickLinks = [
    { label: "ATS Dashboard", to: "/ats", icon: "briefcase" },
    { label: "Schedule Interviews", to: "/interviews", icon: "users" },
    { label: "Job Postings", to: "/job-postings", icon: "file" },
    { label: "Notifications", to: "/notifications", icon: "bell" },
  ];

  const quickLinkIcons = {
    briefcase: Briefcase,
    users: Users,
    file: FileText,
    bell: Bell,
  };

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-[1400px] space-y-8">
          <div className="animate-fade-in-down">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
                  Welcome back, {user?.user?.FullName?.split(" ")[0] || "there"} 👋
                </h1>
                <p className="mt-1 text-sm text-ink-500">
                  Here&apos;s what&apos;s happening across your organisation today.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3.5 py-2 ring-1 ring-ink-200/60 backdrop-blur-sm dark:bg-white/5 dark:ring-ink-700/40">
                <Calendar className="h-4 w-4 text-brand-600" />
                <span className="text-sm font-medium text-ink-600">
                  {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {canManage && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-4">
                <StatCard
                  label="Total Employees"
                  value={stats?.employees ?? "—"}
                  color="blue"
                  icon={
                    <Users className="h-5 w-5" />
                  }
                />
                <StatCard
                  label="Active Jobs"
                  value={stats?.activeJobs ?? "—"}
                  color="green"
                  icon={
                    <Briefcase className="h-5 w-5" />
                  }
                />
                <StatCard
                  label="Total Applicants"
                  value={stats?.candidates ?? "—"}
                  color="purple"
                  icon={
                    <GraduationCap className="h-5 w-5" />
                  }
                />
                <StatCard
                  label="Applications"
                  value={stats?.applications ?? "—"}
                  color="indigo"
                  icon={
                    <FileText className="h-5 w-5" />
                  }
                />
                <StatCard
                  label="Upcoming Interviews"
                  value={stats?.upcomingInterviews ?? "—"}
                  color="amber"
                  icon={
                    <Calendar className="h-5 w-5" />
                  }
                />
                <StatCard
                  label="Present Today"
                  value={attendanceToday ? `${attendanceToday.present}/${attendanceToday.total ?? "—"}` : "—"}
                  color="teal"
                  icon={
                    <CircleCheck className="h-5 w-5" />
                  }
                />
                <StatCard
                  label="Pending Leaves"
                  value={pendingLeaves ?? "—"}
                  color="rose"
                  icon={
                    <CalendarDays className="h-5 w-5" />
                  }
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {quickLinks.map((link, idx) => {
                  const Icon = quickLinkIcons[link.icon];
                  return (
                    <Link
                      key={idx}
                      to={link.to}
                      className="group inline-flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 text-sm font-medium text-ink-700 ring-1 ring-ink-200/60 shadow-sm backdrop-blur-sm transition-all duration-200 ease-smooth hover:ring-brand-300 hover:text-brand-700 hover:shadow-md hover:-translate-y-0.5 dark:bg-white/5 dark:ring-ink-700/40 dark:hover:ring-brand-500/40 dark:hover:text-brand-300">
                      <Icon className="h-4 w-4 text-brand-600 transition-transform duration-300 group-hover:scale-110" />
                      {link.label}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hidden lg:block">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-brand-500" />
                  Meetings Held Each Month
                </h3>
              </div>
              {chartData.labels.length ? (
                <div className="h-72">
                  <LineChart data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center">
                  <p className="text-xs text-ink-400">No meeting data yet</p>
                </div>
              )}
            </Card>
            <Card className="hidden lg:block">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-pink-500" />
                  Meetings by Employees
                </h3>
              </div>
              {employeesChartData.labels.length ? (
                <div className="h-72">
                  <LineChart data={employeesChartData} options={employeesChartOptions} />
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center">
                  <p className="text-xs text-ink-400">No employee meeting data yet</p>
                </div>
              )}
            </Card>
          </div>

          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-ink-950">Quick Access</h2>
              <p className="text-sm text-ink-500 mt-0.5">Jump into your most used tools</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {featureCards.map((item, idx) => (
                <TitleCard key={idx} {...item} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            <CalendarWidget />
            <Card>
              <h3 className="text-sm font-semibold text-ink-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                Upcoming Events
              </h3>
              <div className="max-h-[300px] overflow-y-auto space-y-2 scrollbar-thin pr-1">
                {EventData.length === 0 ? (
                  <p className="text-xs text-ink-400 py-8 text-center bg-surface-100/60 rounded-xl">
                    No upcoming events
                  </p>
                ) : (
                  EventData.map((event, idx) => (
                    <div
                      key={idx}
                      className="group flex items-start gap-3 p-3 rounded-xl border border-ink-200/50 bg-ink-50/40 hover:bg-white hover:border-brand-200 hover:shadow-card-hover transition-all duration-300 ease-smooth">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm ring-1 ring-ink-200/60">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-ink-900 mb-0.5">{event.title}</h3>
                        <p className="text-[11px] font-medium text-brand-600 mb-0.5">{event.date}</p>
                        <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">{event.desc}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-ink-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Notifications
              </h3>
              <div className="max-h-[300px] overflow-y-auto space-y-2 scrollbar-thin pr-1">
                {Notifications.length === 0 ? (
                  <p className="text-xs text-ink-400 py-8 text-center bg-surface-100/60 rounded-xl">
                    No notifications
                  </p>
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
        </div>
      </main>
    </div>
  );
};

export default Overview;
