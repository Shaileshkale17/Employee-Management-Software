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

const HR_ROLES = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"];

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
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
    icon: <path d="M14 4v10.54a4 4 0 11-4 0V4a2 2 0 014 0z" />,
    color: "bg-brand-50 text-brand-600",
  },
  {
    key: "Casual",
    label: "Casual Leave",
    icon: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </>
    ),
    color: "bg-amber-50 text-amber-600",
  },
  {
    key: "Paid",
    label: "Paid Leave",
    icon: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
      </>
    ),
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "Unpaid",
    label: "Unpaid Leave",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18M9.75 15l4.5 4.5M14.25 15l-4.5 4.5" />
      </>
    ),
    color: "bg-gray-100 text-gray-600",
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
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.Pending}`}>
      {status || "Pending"}
    </span>
  );

  const renderSkeleton = () => (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="flex">
      {SideNav(role)}
      <div className="flex-1 min-h-[calc(100vh-4rem)] bg-surface-100 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <Heading heading="Leave Management" />
            <p className="text-sm text-gray-500 mt-1">Track your leave balance, apply for leave and review requests.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {balanceMeta.map((item) => {
              const bal = balances[item.key] || {};
              const remaining = bal.remaining ?? 0;
              const used = bal.used ?? 0;
              const total = bal.total ?? 0;
              return (
                <div key={item.key} className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        {item.icon}
                      </svg>
                    </span>
                    <span className="text-xs font-semibold text-gray-400">{item.label}</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {remaining}
                    <span className="text-sm font-medium text-gray-400 ml-2">remaining</span>
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                    <span>
                      Used <strong className="text-gray-700">{used}</strong>
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>
                      Total <strong className="text-gray-700">{total}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Apply for Leave</h2>
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

          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">My Leave Requests</h2>
            {myLoading ? (
              renderSkeleton()
            ) : myLeaves.length === 0 ? (
              <EmptyState title="No leave requests yet" description="Your submitted leave requests will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-200">
                      <th className="px-3 py-3">Leave Type</th>
                      <th className="px-3 py-3">Start Date</th>
                      <th className="px-3 py-3">End Date</th>
                      <th className="px-3 py-3">Days</th>
                      <th className="px-3 py-3">Reason</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLeaves.map((leave) => (
                      <tr key={leave._id} className="border-b border-gray-50 hover:bg-surface-50 transition-colors">
                        <td className="px-3 py-3 font-medium text-gray-800 whitespace-nowrap">{leave.leaveType}</td>
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{formatDate(leave.startDate)}</td>
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{formatDate(leave.endDate)}</td>
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{daysBetween(leave.startDate, leave.endDate)}</td>
                        <td className="px-3 py-3 text-gray-600 max-w-[220px] truncate" title={leave.reason}>{leave.reason || "—"}</td>
                        <td className="px-3 py-3 whitespace-nowrap">{renderChip(leave.status)}</td>
                        <td className="px-3 py-3 text-gray-400 whitespace-nowrap">{formatDate(leave.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {isHR && (
            <Card>
              <h2 className="text-base font-semibold text-gray-900 mb-4">All Leave Requests</h2>
              {allLoading ? (
                renderSkeleton()
              ) : allLeaves.length === 0 ? (
                <EmptyState title="No leave requests found" description="Leave requests submitted by employees will appear here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-200">
                        <th className="px-3 py-3">Employee</th>
                        <th className="px-3 py-3">Leave Type</th>
                        <th className="px-3 py-3">Start Date</th>
                        <th className="px-3 py-3">End Date</th>
                        <th className="px-3 py-3">Days</th>
                        <th className="px-3 py-3">Reason</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allLeaves.map((leave) => (
                        <tr key={leave._id} className="border-b border-gray-50 hover:bg-surface-50 transition-colors">
                          <td className="px-3 py-3">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 truncate">{leave.employeeId?.name || "Unknown"}</p>
                              <p className="text-xs text-gray-400">{leave.employeeId?.employeeId || leave.employeeId?.designation || ""}</p>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-medium text-gray-800 whitespace-nowrap">{leave.leaveType}</td>
                          <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{formatDate(leave.startDate)}</td>
                          <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{formatDate(leave.endDate)}</td>
                          <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{daysBetween(leave.startDate, leave.endDate)}</td>
                          <td className="px-3 py-3 text-gray-600 max-w-[220px] truncate" title={leave.reason}>{leave.reason || "—"}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{renderChip(leave.status)}</td>
                          <td className="px-3 py-3 whitespace-nowrap">
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
      </div>
    </div>
  );
};

export default Leaves;
