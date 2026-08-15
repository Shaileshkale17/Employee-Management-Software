import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Calendar, CircleCheck, CircleX, Clock, Users } from "lucide-react";
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
const fmtMinutes = (min) => {
  const m = Number(min) || 0;
  if (m <= 0) return "0m";
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h > 0 ? `${h}h ${r}m` : `${r}m`;
};

const statusChip = (status) => {
  const map = {
    Present: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
    Absent: "bg-red-50 text-red-700 ring-red-500/20",
    Leave: "bg-amber-50 text-amber-700 ring-amber-500/20",
  };
  return `chip ring-1 ${map[status] || "bg-ink-50 text-ink-500 ring-ink-500/20"}`;
};

const approvalChip = (status) => {
  const map = {
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
    pending: "bg-amber-50 text-amber-700 ring-amber-500/20",
    rejected: "bg-red-50 text-red-700 ring-red-500/20",
  };
  return `chip ring-1 ${map[status] || "bg-ink-50 text-ink-500 ring-ink-500/20"}`;
};

const Attendance_Info = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
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

  const handleApproval = async (id, approvalStatus) => {
    try {
      await api.put(`/attendance/${id}`, { approvalStatus });
      toast.success(`Record ${approvalStatus}`);
      fetchAllRecords();
    } catch {
      toast.error("Failed to update approval status");
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(0, i).toLocaleString("default", { month: "long" }),
  }));
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 animate-fade-in-down">
            <Heading heading="Attendance Info" subtitle="Track your check-ins, breaks and monthly attendance." />
            <div className="flex items-end gap-3">
              <Button
                variant="secondary"
                label="Smart Check-In"
                onClick={() => navigate("/attendance/smart-checkin")}
                className="shrink-0"
              />
              <div className="w-40">
                <SelectBox
                  id="month"
                  name="month"
                  label="Month"
                  setInput={setMonth}
                  getInput={String(month)}
                  option={months}
                />
              </div>
              <div className="w-40">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-in-up">
            <StatCard
              label="Present"
              value={summary?.present ?? 0}
              color="green"
              icon={<CircleCheck className="w-5 h-5" />}
            />
            <StatCard
              label="Absent"
              value={summary?.absent ?? 0}
              color="red"
              icon={<CircleX className="w-5 h-5" />}
            />
            <StatCard
              label="Leave"
              value={summary?.leave ?? 0}
              color="amber"
              icon={<Calendar className="w-5 h-5" />}
            />
            <StatCard
              label="Total Hours"
              value={summary?.totalHours ?? 0}
              color="brand"
              icon={<Clock className="w-5 h-5" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
            <Card>
              <h3 className="text-sm font-semibold text-ink-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-soft" />
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
                  <div className="text-xs text-ink-500 space-y-1.5">
                    <p>
                      <span className="font-medium text-ink-700">Check In:</span> {fmtTime(today.checkIn)}
                    </p>
                    <p>
                      <span className="font-medium text-ink-700">Check Out:</span> {fmtTime(today.checkOut)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-400">No attendance recorded yet today.</p>
              )}
            </Card>
            <Card className="lg:col-span-2">
              <ClickInAndClickOut />
            </Card>
          </div>

          <Card className="animate-fade-in-up">
            <h3 className="text-sm font-semibold text-ink-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              My Records
            </h3>
            {recordsLoading ? (
              <SkeletonList rows={4} />
            ) : records.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-7 w-7" />}
                title="No attendance records"
                description="No records found for the selected month."
              />
            ) : (
              <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-200/60 bg-surface-100/70">
                      <th className="table-th">Date</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Check In</th>
                      <th className="table-th">Check Out</th>
                      <th className="table-th">Breaks</th>
                      <th className="table-th">Hours</th>
                      <th className="table-th">Late</th>
                      <th className="table-th">Overtime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r._id} className="border-b border-ink-100 last:border-0 hover:bg-surface-50/60 transition-colors">
                        <td className="table-td text-ink-800 font-medium">{fmtDate(r.date)}</td>
                        <td className="table-td">
                          <span className={statusChip(r.status)}>{r.status}</span>
                        </td>
                        <td className="table-td text-ink-500">{fmtTime(r.checkIn)}</td>
                        <td className="table-td text-ink-500">{fmtTime(r.checkOut)}</td>
                        <td className="table-td text-ink-500">{fmtMinutes(r.breakMinutes)}</td>
                        <td className="table-td text-ink-500">{fmtMinutes(r.totalMinutes)}</td>
                        <td className="table-td">
                          {r.isLate ? (
                            <span className="text-red-600 font-medium">{fmtMinutes(r.lateMinutes)}</span>
                          ) : (
                            <span className="text-ink-400">--</span>
                          )}
                        </td>
                        <td className="table-td">
                          {r.overtimeMinutes > 0 ? (
                            <span className="text-emerald-600 font-medium">{fmtMinutes(r.overtimeMinutes)}</span>
                          ) : (
                            <span className="text-ink-400">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {isHR && (
            <Card className="animate-fade-in-up">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
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
                icon={<Users className="h-7 w-7" />}
                title="No employee records"
                  description="No attendance records match the selected filters."
                />
              ) : (
                <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink-200/60 bg-surface-100/70">
                        <th className="table-th">Employee Name</th>
                        <th className="table-th">Employee ID</th>
                        <th className="table-th">Department</th>
                        <th className="table-th">Date</th>
                        <th className="table-th">Status</th>
                        <th className="table-th">Check In</th>
                        <th className="table-th">Check Out</th>
                        <th className="table-th">Hours</th>
                        <th className="table-th">Overtime</th>
                        <th className="table-th">Approval</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRecords.map((r) => (
                        <tr key={r._id} className="border-b border-ink-100 last:border-0 hover:bg-surface-50/60 transition-colors">
                          <td className="table-td font-medium text-ink-900">
                            {r.employeeId?.name || "--"}
                          </td>
                          <td className="table-td text-ink-500">
                            {r.employeeId?.employeeId || "--"}
                          </td>
                          <td className="table-td text-ink-500">
                            {r.employeeId?.department || "--"}
                          </td>
                          <td className="table-td text-ink-500">{fmtDate(r.date)}</td>
                          <td className="table-td">
                            <span className={statusChip(r.status)}>{r.status}</span>
                          </td>
                          <td className="table-td text-ink-500">{fmtTime(r.checkIn)}</td>
                          <td className="table-td text-ink-500">{fmtTime(r.checkOut)}</td>
                          <td className="table-td text-ink-500">{fmtMinutes(r.totalMinutes)}</td>
                          <td className="table-td">
                            {r.overtimeMinutes > 0 ? (
                              <span className="text-emerald-600 font-medium">{fmtMinutes(r.overtimeMinutes)}</span>
                            ) : (
                              <span className="text-ink-400">--</span>
                            )}
                          </td>
                          <td className="table-td">
                            <div className="flex items-center gap-2">
                              <span className={approvalChip(r.approvalStatus)}>
                                {(r.approvalStatus || "approved").charAt(0).toUpperCase() + (r.approvalStatus || "approved").slice(1)}
                              </span>
                              {r.approvalStatus !== "approved" && (
                                <button
                                  onClick={() => handleApproval(r._id, "approved")}
                                  className="rounded-lg bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-emerald-600"
                                  aria-label="Approve">
                                  Approve
                                </button>
                              )}
                              {r.approvalStatus !== "rejected" && (
                                <button
                                  onClick={() => handleApproval(r._id, "rejected")}
                                  className="rounded-lg bg-red-500 px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-red-600"
                                  aria-label="Reject">
                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Attendance_Info;
