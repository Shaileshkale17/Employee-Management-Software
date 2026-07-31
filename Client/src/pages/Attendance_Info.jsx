import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import ClickInAndClickOut from "../components/clickInAndClickOut";
import { api, authHeaders, BASE_URL } from "../utils/api";
import Heading from "../components/Heading";
import Card from "../components/Card";
import StatCard from "../components/StatCard";
import Button from "../components/Button";
import InputBox from "../components/InputBox";
import SelectBox from "../components/SelectBox";
import EmptyState from "../components/EmptyState";
import Skeleton, { SkeletonList } from "../components/Skeleton";

const HR_ROLES = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"];

const fmtTime = (value) => (value ? new Date(value).toLocaleTimeString() : "--");
const fmtDate = (value) => (value ? new Date(value).toLocaleDateString() : "--");

const statusChip = (status) => {
  const map = {
    Present: "bg-green-50 text-green-600 border-green-100",
    Absent: "bg-red-50 text-red-600 border-red-100",
    Leave: "bg-amber-50 text-amber-600 border-amber-100",
  };
  return `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
    map[status] || "bg-gray-50 text-gray-500 border-gray-100"
  }`;
};

const Attendance_Info = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.user?.role;
  const isHR = HR_ROLES.includes(role);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [today, setToday] = useState(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [allRecords, setAllRecords] = useState([]);
  const [allLoading, setAllLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  const SideNav = (r) =>
    HR_ROLES.includes(r) ? <HRSideNavber /> : <SideNavbar />;

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get("/attendance/summary", { params: { month, year } });
      setSummary(res.data.data);
    } catch {
      toast.error("Failed to load attendance summary");
    }
  }, [month, year]);

  const fetchToday = useCallback(async () => {
    try {
      setTodayLoading(true);
      const res = await api.get("/attendance/today");
      setToday(res.data.data);
    } catch {
      toast.error("Failed to load today's attendance");
    } finally {
      setTodayLoading(false);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      setRecordsLoading(true);
      const res = await api.get("/attendance/my", { params: { month, year } });
      setRecords(res.data.data?.data || []);
    } catch {
      toast.error("Failed to load attendance records");
    } finally {
      setRecordsLoading(false);
    }
  }, [month, year]);

  const fetchAllRecords = useCallback(async () => {
    if (!isHR) return;
    try {
      setAllLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (fromFilter) params.from = fromFilter;
      if (toFilter) params.to = toFilter;
      const res = await api.get("/attendance", { params });
      setAllRecords(res.data.data?.data || []);
    } catch {
      toast.error("Failed to load employee attendance");
    } finally {
      setAllLoading(false);
    }
  }, [isHR, statusFilter, fromFilter, toFilter]);

  useEffect(() => {
    fetchSummary();
    fetchRecords();
  }, [fetchSummary, fetchRecords]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  useEffect(() => {
    fetchAllRecords();
  }, [fetchAllRecords]);

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const res = await fetch(
        `${BASE_URL}/report/export/attendance?month=${month}&year=${year}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename=(?:UTF-8'')?["']?([^"';]+)["']?/i);
      const filename = match?.[1] ? decodeURIComponent(match[1].trim()) : "attendance.csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Attendance exported");
    } catch {
      toast.error("Failed to export attendance");
    } finally {
      setExportLoading(false);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(0, i).toLocaleString("default", { month: "long" }),
  }));
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="flex">
      {SideNav(role)}
      <div className="flex-1 min-h-[calc(100vh-4rem)] bg-surface-100 p-6 overflow-y-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <Heading heading="Attendance Info" />
          <div className="flex items-center gap-3">
            <SelectBox
              id="month"
              name="month"
              label="Month"
              setInput={setMonth}
              getInput={String(month)}
              option={months}
            />
            <SelectBox
              id="year"
              name="year"
              label="Year"
              setInput={setYear}
              getInput={String(year)}
              option={years.map((y) => ({ value: String(y), label: String(y) }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Present"
            value={summary?.present ?? 0}
            color="green"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
          />
          <StatCard
            label="Absent"
            value={summary?.absent ?? 0}
            color="red"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            }
          />
          <StatCard
            label="Leave"
            value={summary?.leave ?? 0}
            color="amber"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
          />
          <StatCard
            label="Total Hours"
            value={summary?.totalHours ?? 0}
            color="brand"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              Today
            </h3>
            {todayLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : today ? (
              <div className="space-y-3">
                <span className={statusChip(today.status)}>{today.status}</span>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    <span className="font-medium text-gray-700">Check In:</span> {fmtTime(today.checkIn)}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Check Out:</span> {fmtTime(today.checkOut)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No attendance recorded yet today.</p>
            )}
          </Card>
          <Card className="lg:col-span-2">
            <ClickInAndClickOut />
          </Card>
        </div>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            My Records
          </h3>
          {recordsLoading ? (
            <SkeletonList rows={4} />
          ) : records.length === 0 ? (
            <EmptyState
              title="No attendance records"
              description="No records found for the selected month."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Check In</th>
                    <th className="py-3 pr-4 font-medium">Check Out</th>
                    <th className="py-3 pr-4 font-medium">Break In</th>
                    <th className="py-3 font-medium">Break Out</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r._id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4 text-gray-700 whitespace-nowrap">{fmtDate(r.date)}</td>
                      <td className="py-3 pr-4">
                        <span className={statusChip(r.status)}>{r.status}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{fmtTime(r.checkIn)}</td>
                      <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{fmtTime(r.checkOut)}</td>
                      <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{fmtTime(r.checkHoldIn)}</td>
                      <td className="py-3 text-gray-500 whitespace-nowrap">{fmtTime(r.checkHoldOut)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {isHR && (
          <Card className="mt-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                All Employees
              </h3>
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-40">
                  <SelectBox
                    id="statusFilter"
                    name="statusFilter"
                    label="Status"
                    setInput={setStatusFilter}
                    getInput={statusFilter}
                    option={[
                      { value: "Present", label: "Present" },
                      { value: "Absent", label: "Absent" },
                      { value: "Leave", label: "Leave" },
                    ]}
                  />
                </div>
                <div className="w-40">
                  <InputBox
                    label="From"
                    type="date"
                    id="fromFilter"
                    name="fromFilter"
                    setInput={setFromFilter}
                    getInput={fromFilter}
                  />
                </div>
                <div className="w-40">
                  <InputBox
                    label="To"
                    type="date"
                    id="toFilter"
                    name="toFilter"
                    setInput={setToFilter}
                    getInput={toFilter}
                  />
                </div>
                <Button
                  label="Download CSV"
                  variant="secondary"
                  size="sm"
                  loading={exportLoading}
                  onClick={handleExport}
                />
              </div>
            </div>
            {allLoading ? (
              <SkeletonList rows={4} />
            ) : allRecords.length === 0 ? (
              <EmptyState
                title="No employee records"
                description="No attendance records match the selected filters."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="py-3 pr-4 font-medium">Employee Name</th>
                      <th className="py-3 pr-4 font-medium">Employee ID</th>
                      <th className="py-3 pr-4 font-medium">Department</th>
                      <th className="py-3 pr-4 font-medium">Date</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 pr-4 font-medium">Check In</th>
                      <th className="py-3 font-medium">Check Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRecords.map((r) => (
                      <tr key={r._id} className="border-b border-gray-50 last:border-0">
                        <td className="py-3 pr-4 text-gray-900 font-medium whitespace-nowrap">
                          {r.employeeId?.name || "--"}
                        </td>
                        <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                          {r.employeeId?.employeeId || "--"}
                        </td>
                        <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                          {r.employeeId?.department || "--"}
                        </td>
                        <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{fmtDate(r.date)}</td>
                        <td className="py-3 pr-4">
                          <span className={statusChip(r.status)}>{r.status}</span>
                        </td>
                        <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{fmtTime(r.checkIn)}</td>
                        <td className="py-3 text-gray-500 whitespace-nowrap">{fmtTime(r.checkOut)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default Attendance_Info;
