import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api, authHeaders, BASE_URL } from "../utils/api";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import Button from "../components/Button";
import Card from "../components/Card";
import Heading from "../components/Heading";
import SelectBox from "../components/SelectBox";
import EmptyState from "../components/EmptyState";

const HR_ROLES = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"];

const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const REPORT_TITLES = {
  attendance: "Attendance Report",
  leave: "Leave Report",
  event: "Event Report",
};

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "-");

const leaveStatusChip = (status) => {
  const map = {
    Approved: "bg-green-100 text-green-600",
    Pending: "bg-amber-100 text-amber-600",
    Rejected: "bg-red-100 text-red-600",
    Cancelled: "bg-gray-100 text-gray-600",
  };
  return map[status] || "bg-gray-100 text-gray-600";
};

const leaveDays = (leave) => {
  if (!leave.startDate || !leave.endDate) return 1;
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.round((end - start) / 86400000) + 1;
};

const Report = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.user?.role;
  const isHR = HR_ROLES.includes(role);

  const today = new Date();
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [activeReport, setActiveReport] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [leave, setLeave] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState("");

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => current - 3 + i).map((y) => ({ value: String(y), label: String(y) }));
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    setActiveReport("attendance");
    try {
      const res = await api.get("/report/attendance", { params: { month, year } });
      setAttendance(res.data.data?.data || []);
    } catch {
      setAttendance([]);
      toast.error("Failed to load attendance report");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeave = async () => {
    setLoading(true);
    setActiveReport("leave");
    try {
      const res = await api.get("/report/leave", { params: { month, year } });
      setLeave(res.data.data?.data || []);
    } catch {
      setLeave([]);
      toast.error("Failed to load leave report");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    setActiveReport("event");
    try {
      const res = await api.get("/report/event", { params: { month, year } });
      setEvents(res.data.data?.data || []);
    } catch {
      setEvents([]);
      toast.error("Failed to load event report");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async (type) => {
    setDownloading(type);
    try {
      const res = await fetch(`${BASE_URL}/report/export/${type}?month=${month}&year=${year}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}-${month}-${year}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download report");
    } finally {
      setDownloading("");
    }
  };

  const renderSkeleton = () => (
    <div className="p-5 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-6">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-4 w-12" />
        </div>
      ))}
    </div>
  );

  const renderAttendanceTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
            <th className="px-5 py-3 font-semibold">Employee</th>
            <th className="px-5 py-3 font-semibold">Employee ID</th>
            <th className="px-5 py-3 font-semibold">Department</th>
            <th className="px-5 py-3 font-semibold">Designation</th>
            <th className="px-5 py-3 font-semibold">Present</th>
            <th className="px-5 py-3 font-semibold">Absent</th>
            <th className="px-5 py-3 font-semibold">Leave</th>
            <th className="px-5 py-3 font-semibold">Total Hours</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {attendance.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className="px-5 py-3 font-medium text-gray-900">{row.name || "-"}</td>
              <td className="px-5 py-3 text-gray-600">{row.employeeId || "-"}</td>
              <td className="px-5 py-3 text-gray-600">{row.department || "-"}</td>
              <td className="px-5 py-3 text-gray-600">{row.designation || "-"}</td>
              <td className="px-5 py-3 text-gray-600">{row.present ?? 0}</td>
              <td className="px-5 py-3 text-gray-600">{row.absent ?? 0}</td>
              <td className="px-5 py-3 text-gray-600">{row.leave ?? 0}</td>
              <td className="px-5 py-3 text-gray-600">{row.totalHours ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderLeaveTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
            <th className="px-5 py-3 font-semibold">Employee</th>
            <th className="px-5 py-3 font-semibold">Employee ID</th>
            <th className="px-5 py-3 font-semibold">Department</th>
            <th className="px-5 py-3 font-semibold">Type</th>
            <th className="px-5 py-3 font-semibold">Start</th>
            <th className="px-5 py-3 font-semibold">End</th>
            <th className="px-5 py-3 font-semibold">Days</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {leave.map((l, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className="px-5 py-3 font-medium text-gray-900">{l.employeeId?.name || "-"}</td>
              <td className="px-5 py-3 text-gray-600">{l.employeeId?.employeeId || "-"}</td>
              <td className="px-5 py-3 text-gray-600">{l.employeeId?.department || "-"}</td>
              <td className="px-5 py-3 text-gray-600">{l.leaveType || "-"}</td>
              <td className="px-5 py-3 text-gray-600">{formatDate(l.startDate)}</td>
              <td className="px-5 py-3 text-gray-600">{formatDate(l.endDate)}</td>
              <td className="px-5 py-3 text-gray-600">{leaveDays(l)}</td>
              <td className="px-5 py-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${leaveStatusChip(l.status)}`}>
                  {l.status || "-"}
                </span>
              </td>
              <td className="px-5 py-3 text-gray-600 max-w-[260px] truncate">{l.reason || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderEventTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
            <th className="px-5 py-3 font-semibold">Title</th>
            <th className="px-5 py-3 font-semibold">Task Title</th>
            <th className="px-5 py-3 font-semibold">Description</th>
            <th className="px-5 py-3 font-semibold">Start</th>
            <th className="px-5 py-3 font-semibold">End</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {events.map((ev, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className="px-5 py-3 font-medium text-gray-900">{ev.title || ev.taskTitle || "-"}</td>
              <td className="px-5 py-3 text-gray-600">{ev.taskTitle || "-"}</td>
              <td className="px-5 py-3 text-gray-600 max-w-[280px] truncate">{(ev.description ?? ev.desc) || "-"}</td>
              <td className="px-5 py-3 text-gray-600">{formatDate(ev.start || ev.StartDate)}</td>
              <td className="px-5 py-3 text-gray-600">{formatDate(ev.end || ev.EndDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (!activeReport) {
      return <EmptyState title="No report selected" description="Choose a report type above to view data." />;
    }
    if (activeReport === "attendance") {
      return attendance.length === 0 ? (
        <EmptyState title="No attendance data" description="No attendance records found for the selected month." />
      ) : (
        renderAttendanceTable()
      );
    }
    if (activeReport === "leave") {
      return leave.length === 0 ? (
        <EmptyState title="No leave data" description="No approved leaves found for the selected month." />
      ) : (
        renderLeaveTable()
      );
    }
    return events.length === 0 ? (
      <EmptyState title="No events found" description="No events found for the selected month." />
    ) : (
      renderEventTable()
    );
  };

  return (
    <div className="flex">
      {isHR ? <HRSideNavber /> : <SideNavbar />}
      <div className="flex-1 min-h-[calc(100vh-4rem)] bg-surface-100 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <Heading heading="Reports" />

          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Generate Reports</h2>
              <p className="text-xs text-gray-400 mt-0.5">Select a month and year to generate company reports</p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-40">
                <SelectBox label="Month" name="month" getInput={month} setInput={setMonth} option={MONTH_OPTIONS} />
              </div>
              <div className="w-32">
                <SelectBox label="Year" name="year" getInput={year} setInput={setYear} option={yearOptions} />
              </div>
              <Button
                label="Attendance Report"
                loading={loading && activeReport === "attendance"}
                onClick={fetchAttendance}
              />
              <Button label="Leave Report" loading={loading && activeReport === "leave"} onClick={fetchLeave} />
              <Button label="Event Report" loading={loading && activeReport === "event"} onClick={fetchEvents} />
              <Button
                variant="secondary"
                label="Download Attendance CSV"
                loading={downloading === "attendance"}
                onClick={() => downloadCSV("attendance")}
              />
              <Button
                variant="secondary"
                label="Download Leave CSV"
                loading={downloading === "leave"}
                onClick={() => downloadCSV("leave")}
              />
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{REPORT_TITLES[activeReport] || "Report Data"}</h2>
            </div>
            {renderContent()}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Report;
