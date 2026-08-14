import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { api } from "../utils/api";
import Heading from "../components/Heading";
import Card from "../components/Card";
import Button from "../components/Button";
import InputBox from "../components/InputBox";
import SelectBox from "../components/SelectBox";
import TextArea from "../components/TextArea";
import EmptyState from "../components/EmptyState";
import { CalendarX, CreditCard, Sun, Thermometer, Users } from "lucide-react";

const HR_ROLES = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"];

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-500/20",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  Rejected: "bg-red-50 text-red-700 ring-red-500/20",
};

const leaveOptions = [
  { value: "Sick", label: "Sick" },
  { value: "Casual", label: "Casual" },
  { value: "Paid", label: "Paid" },
  { value: "Unpaid", label: "Unpaid" },
];

const balanceMeta = [
  {
    key: "Sick",
    label: "Sick Leave",
    icon: <Thermometer className="w-5 h-5" />,
    color: "bg-brand-50 text-brand-600",
  },
  {
    key: "Casual",
    label: "Casual Leave",
    icon: <Sun className="w-5 h-5" />,
    color: "bg-amber-50 text-amber-600",
  },
  {
    key: "Paid",
    label: "Paid Leave",
    icon: <CreditCard className="w-5 h-5" />,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "Unpaid",
    label: "Unpaid Leave",
    icon: <CalendarX className="w-5 h-5" />,
    color: "bg-ink-100 text-ink-600",
  },
];

const initialForm = { leaveType: "", startDate: "", endDate: "", reason: "" };

const toDate = (value) => {
  if (!value) return null;
  const [y, m, d] = String(value).split("T")[0].split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const formatDate = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString() : "—";
};

const daysBetween = (start, end) => {
  const a = toDate(start);
  const b = toDate(end);
  if (!a || !b) return 0;
  return Math.round((b - a) / 86400000) + 1;
};

const Leaves = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.user?.role;
  const isHR = HR_ROLES.includes(role);

  const SideNav = () => (isHR ? <HRSideNavber /> : <SideNavbar />);

  const [balances, setBalances] = useState({});
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [myLeaves, setMyLeaves] = useState([]);
  const [myLoading, setMyLoading] = useState(true);
  const [allLeaves, setAllLeaves] = useState([]);
  const [allLoading, setAllLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const fetchBalances = useCallback(async () => {
    try {
      const res = await api.get("/leave/balance");
      setBalances(res.data.data || {});
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load leave balance");
    }
  }, []);

  const fetchMyLeaves = useCallback(async () => {
    setMyLoading(true);
    try {
      const res = await api.get("/leave/my");
      setMyLeaves(res.data.data?.data || res.data.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load your leave requests");
    } finally {
      setMyLoading(false);
    }
  }, []);

  const fetchAllLeaves = useCallback(async () => {
    setAllLoading(true);
    try {
      const res = await api.get("/leave");
      setAllLeaves(res.data.data?.data || res.data.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load leave requests");
    } finally {
      setAllLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalances();
    fetchMyLeaves();
    if (isHR) fetchAllLeaves();
  }, [fetchBalances, fetchMyLeaves, fetchAllLeaves, isHR]);

  const reloadAll = () => {
    fetchBalances();
    fetchMyLeaves();
    if (isHR) fetchAllLeaves();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.leaveType || !form.startDate || !form.endDate) {
      toast.error("Leave type, start date and end date are required");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/leave/", {
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });
      toast.success("Leave request submitted");
      setForm(initialForm);
      reloadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdating({ id, status });
    try {
      await api.put(`/leave/${id}/status`, { status });
      toast.success(`Leave ${status.toLowerCase()}`);
      reloadAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to ${status.toLowerCase()} leave`);
    } finally {
      setUpdating(null);
    }
  };

  const renderChip = (status) => (
    <span className={`chip ring-1 ${statusStyles[status] || statusStyles.Pending}`}>
      {status || "Pending"}
    </span>
  );

  const renderSkeleton = () => (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton h-10 rounded-xl" />
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="animate-fade-in-down">
            <Heading heading="Leave Management" subtitle="Track your leave balance, apply for leave and review requests." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-in-up">
            {balanceMeta.map((item) => {
              const bal = balances[item.key] || {};
              const remaining = bal.remaining ?? 0;
              const used = bal.used ?? 0;
              const total = bal.total ?? 0;
              return (
                <Card hover key={item.key}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      {item.icon}
                    </span>
                    <span className="text-xs font-semibold text-ink-400">{item.label}</span>
                  </div>
                  <p className="text-3xl font-bold text-ink-950 tabular-nums">
                    {remaining}
                    <span className="text-sm font-medium text-ink-400 ml-2">remaining</span>
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-ink-500">
                    <span>
                      Used <strong className="text-ink-800">{used}</strong>
                    </span>
                    <span className="w-1 h-1 rounded-full bg-ink-300" />
                    <span>
                      Total <strong className="text-ink-800">{total}</strong>
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="animate-fade-in-up">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-ink-950">Apply for Leave</h2>
              <p className="text-xs text-ink-400 mt-0.5">Submit a new leave request</p>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectBox label="Leave Type" id="leaveType" name="leaveType" setInput={set("leaveType")} getInput={form.leaveType} option={leaveOptions} />
              <InputBox label="Start Date" id="startDate" name="startDate" type="date" setInput={set("startDate")} getInput={form.startDate} />
              <InputBox label="End Date" id="endDate" name="endDate" type="date" setInput={set("endDate")} getInput={form.endDate} />
              <div className="md:col-span-3">
                <TextArea label="Reason" id="reason" name="reason" placeholder="Reason for leave" value={form.reason} onChange={(e) => set("reason")(e.target.value)} rows={3} />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" label="Submit Request" loading={submitting} disabled={submitting} />
              </div>
            </form>
          </Card>

          <Card className="p-0 overflow-hidden animate-fade-in-up">
            <div className="px-5 sm:px-6 py-4 border-b border-ink-200/60 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink-950">My Leave Requests</h2>
                <p className="text-xs text-ink-400 mt-0.5">{myLeaves.length} request(s)</p>
              </div>
            </div>
            {myLoading ? (
              <div className="p-5 sm:p-6">
                {renderSkeleton()}
              </div>
            ) : myLeaves.length === 0 ? (
              <EmptyState
                icon={<CalendarX className="h-7 w-7" />}
                title="No leave requests yet"
                description="Your submitted leave requests will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-200/60 bg-surface-100/70">
                      <th className="table-th">Leave Type</th>
                      <th className="table-th">Start Date</th>
                      <th className="table-th">End Date</th>
                      <th className="table-th">Days</th>
                      <th className="table-th">Reason</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLeaves.map((leave) => (
                      <tr key={leave._id} className="border-b border-ink-100 last:border-0 hover:bg-surface-50/60 transition-colors">
                        <td className="table-td font-medium text-ink-800">{leave.leaveType}</td>
                        <td className="table-td text-ink-600">{formatDate(leave.startDate)}</td>
                        <td className="table-td text-ink-600">{formatDate(leave.endDate)}</td>
                        <td className="table-td text-ink-600">{daysBetween(leave.startDate, leave.endDate)}</td>
                        <td className="table-td text-ink-600 max-w-[220px] truncate" title={leave.reason}>{leave.reason || "—"}</td>
                        <td className="table-td">{renderChip(leave.status)}</td>
                        <td className="table-td text-ink-400">{formatDate(leave.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {isHR && (
            <Card className="p-0 overflow-hidden animate-fade-in-up">
              <div className="px-5 sm:px-6 py-4 border-b border-ink-200/60 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ink-950">All Leave Requests</h2>
                  <p className="text-xs text-ink-400 mt-0.5">{allLeaves.length} request(s)</p>
                </div>
              </div>
              {allLoading ? (
                <div className="p-5 sm:p-6">
                  {renderSkeleton()}
                </div>
              ) : allLeaves.length === 0 ? (
                <EmptyState
                icon={<Users className="h-7 w-7" />}
                title="No leave requests found"
                  description="Leave requests submitted by employees will appear here."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink-200/60 bg-surface-100/70">
                        <th className="table-th">Employee</th>
                        <th className="table-th">Leave Type</th>
                        <th className="table-th">Start Date</th>
                        <th className="table-th">End Date</th>
                        <th className="table-th">Days</th>
                        <th className="table-th">Reason</th>
                        <th className="table-th">Status</th>
                        <th className="table-th">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allLeaves.map((leave) => (
                        <tr key={leave._id} className="border-b border-ink-100 last:border-0 hover:bg-surface-50/60 transition-colors">
                          <td className="table-td">
                            <div className="min-w-0">
                              <p className="font-medium text-ink-800 truncate">{leave.employeeId?.name || "Unknown"}</p>
                              <p className="text-xs text-ink-400">{leave.employeeId?.employeeId || leave.employeeId?.designation || ""}</p>
                            </div>
                          </td>
                          <td className="table-td font-medium text-ink-800">{leave.leaveType}</td>
                          <td className="table-td text-ink-600">{formatDate(leave.startDate)}</td>
                          <td className="table-td text-ink-600">{formatDate(leave.endDate)}</td>
                          <td className="table-td text-ink-600">{daysBetween(leave.startDate, leave.endDate)}</td>
                          <td className="table-td text-ink-600 max-w-[220px] truncate" title={leave.reason}>{leave.reason || "—"}</td>
                          <td className="table-td">{renderChip(leave.status)}</td>
                          <td className="table-td">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                label="Approve"
                                onClick={() => updateStatus(leave._id, "Approved")}
                                disabled={leave.status !== "Pending" || updating?.id === leave._id}
                                loading={updating?.id === leave._id && updating?.status === "Approved"}
                              />
                              <Button
                                size="sm"
                                label="Reject"
                                variant="danger"
                                onClick={() => updateStatus(leave._id, "Rejected")}
                                disabled={leave.status !== "Pending" || updating?.id === leave._id}
                                loading={updating?.id === leave._id && updating?.status === "Rejected"}
                              />
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

export default Leaves;
