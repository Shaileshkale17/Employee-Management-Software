import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import Card from "../components/Card";
import Heading from "../components/Heading";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";
import { ClockIcon, CheckIcon, CalendarIcon } from "../components/hr/icons";
import { api } from "../utils/api";

const SideNav = (role) =>
  ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(role)
    ? <HRSideNavber />
    : <SideNavbar />;

const todayISO = () => new Date().toISOString().slice(0, 10);

const AttendanceLeaveTracking = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.user?.role;

  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayISO());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [attRes, leaveRes] = await Promise.all([
          api.get("/attendance/", { params: { from: date, to: date, limit: 100 } }),
          api.get("/leave/", { params: { limit: 100 } }),
        ]);
        setAttendance(Array.isArray(attRes.data.data?.data) ? attRes.data.data.data : []);
        setLeaves(Array.isArray(leaveRes.data.data?.data) ? leaveRes.data.data.data : []);
      } catch {
        setAttendance([]);
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [date]);

  const present = attendance.filter((a) => a.status === "Present").length;
  const absent = attendance.filter((a) => a.status === "Absent").length;
  const onLeaveToday = attendance.filter((a) => a.status === "Leave").length;
  const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
  const approvedLeaves = leaves.filter((l) => l.status === "Approved").length;

  const todayAttendance = useMemo(
    () => attendance.filter((a) => String(a.date).slice(0, 10) === date),
    [attendance, date]
  );

  const leaveChips = {
    Pending: "bg-amber-50 text-amber-700",
    Approved: "bg-emerald-50 text-emerald-700",
    Rejected: "bg-red-50 text-red-700",
  };
  const attChips = {
    Present: "bg-emerald-50 text-emerald-700",
    Absent: "bg-red-50 text-red-700",
    Leave: "bg-amber-50 text-amber-700",
  };

  const initials = (name = "") =>
    name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in-down">
            <Heading
              heading="Attendance & Leave Tracking"
              subtitle="Monitor daily attendance and leave requests across the company"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-base w-auto"
              aria-label="Attendance date"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
            <StatCard label="Present" value={present} color="green" icon={<CheckIcon />} />
            <StatCard label="Absent" value={absent} color="red" icon={<ClockIcon />} />
            <StatCard label="On Leave" value={onLeaveToday} color="amber" icon={<CalendarIcon />} />
            <StatCard label="Pending Leaves" value={pendingLeaves} color="blue" icon={<CalendarIcon />} />
          </div>

          {loading ? (
            <SkeletonList rows={4} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink-800">Attendance — {date || "today"}</h2>
                  <span className="text-xs text-ink-400">{todayAttendance.length} records</span>
                </div>
                {todayAttendance.length === 0 ? (
                  <Card padding={false}>
                    <EmptyState
                      icon={<CalendarIcon />}
                      title="No attendance records"
                      description="No attendance records were found for this date."
                    />
                  </Card>
                ) : (
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                    {todayAttendance.map((rec) => {
                      const emp = rec.employeeId || {};
                      return (
                        <Card key={rec._id} className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold ring-1 ring-brand-500/10">
                              {initials(emp.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold text-ink-900 truncate">{emp.name || "Unknown"}</p>
                              <p className="text-[11px] text-ink-400 truncate">
                                {rec.checkIn ? `In ${new Date(rec.checkIn).toLocaleTimeString()}` : "Not checked in"}
                                {rec.checkOut ? ` · Out ${new Date(rec.checkOut).toLocaleTimeString()}` : ""}
                              </p>
                            </div>
                            <span className={`chip ${attChips[rec.status] || "bg-ink-100 text-ink-600"}`}>{rec.status}</span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink-800">Leave Requests</h2>
                  <span className="text-xs text-ink-400">{approvedLeaves} approved</span>
                </div>
                {leaves.length === 0 ? (
                  <Card padding={false}>
                    <EmptyState
                      icon={<CalendarIcon />}
                      title="No leave requests"
                      description="Leave requests will appear here once employees apply."
                    />
                  </Card>
                ) : (
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                    {leaves.map((lv) => {
                      const emp = lv.employeeId || {};
                      return (
                        <Card key={lv._id} className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold ring-1 ring-purple-500/10">
                              {initials(emp.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold text-ink-900 truncate">{emp.name || "Unknown"}</p>
                              <p className="text-[11px] text-ink-400 truncate">
                                {lv.leaveType} · {lv.startDate?.slice?.(0, 10) || ""}
                                {lv.endDate ? ` → ${lv.endDate.slice(0, 10)}` : ""}
                              </p>
                            </div>
                            <span className={`chip ${leaveChips[lv.status] || "bg-ink-100 text-ink-600"}`}>{lv.status}</span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AttendanceLeaveTracking;
