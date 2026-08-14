import { useEffect, useState } from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import Card from "../components/Card";
import Button from "../components/Button";
import Heading from "../components/Heading";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api } from "../utils/api";
import { Calendar, CircleCheck, CircleX } from "lucide-react";

const statusStyles = {
  Scheduled: "bg-brand-50 text-brand-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Cancelled: "bg-red-50 text-red-700",
};

const NewEmployeeOrientation = () => {
  const { user } = useSelector((state) => state.auth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    employee: "",
    orientationDate: "",
    notes: "",
  });
  const [employees, setEmployees] = useState([]);

  const SideNav = (role) =>
    ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(role)
      ? <HRSideNavber />
      : <SideNavbar />;

  const fetchRecords = async () => {
    try {
      const res = await api.get("/onboarding/onboarding-all");
      setRecords(res.data.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/emp/emp-get");
      setEmployees(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchEmployees();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.employee || !form.orientationDate) {
      toast.error("Employee and orientation date are required");
      return;
    }
    try {
      await api.post("/onboarding/onboarding-post", form);
      toast.success("Orientation scheduled");
      setShowForm(false);
      setForm({ employee: "", orientationDate: "", notes: "" });
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/onboarding/onboarding-update/${id}`, {
        orientationStatus: status,
      });
      toast.success("Status updated");
      fetchRecords();
    } catch {
      toast.error("Failed to update");
    }
  };

  const initials = (name = "") =>
    name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const scheduledCount = records.filter(
    (r) => r.orientationStatus === "Scheduled",
  ).length;
  const completedCount = records.filter(
    (r) => r.orientationStatus === "Completed",
  ).length;
  const cancelledCount = records.filter(
    (r) => r.orientationStatus === "Cancelled",
  ).length;

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(user?.user?.role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-in-down">
            <Heading
              heading="New Employee Orientation"
              subtitle="Schedule and manage orientation sessions"
            />
            <Button
              label="+ Schedule Orientation"
              onClick={() => setShowForm(!showForm)}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in-up">
            <StatCard
              label="Scheduled"
              value={scheduledCount}
              color="brand"
              icon={<Calendar className="h-5 w-5" />}
            />
            <StatCard
              label="Completed"
              value={completedCount}
              color="green"
              icon={<CircleCheck className="h-5 w-5" />}
            />
            <StatCard
              label="Cancelled"
              value={cancelledCount}
              color="red"
              icon={<CircleX className="h-5 w-5" />}
            />
          </div>

          {showForm && (
            <Card className="animate-fade-in-down">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="orientation-employee"
                      className="text-[13px] font-semibold text-ink-800"
                    >
                      Employee
                    </label>
                    <select
                      id="orientation-employee"
                      value={form.employee}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, employee: e.target.value }))
                      }
                      className="input-base cursor-pointer"
                      required
                    >
                      <option value="">Select employee</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} ({emp.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="orientation-date"
                      className="text-[13px] font-semibold text-ink-800"
                    >
                      Orientation Date
                    </label>
                    <input
                      id="orientation-date"
                      type="date"
                      value={form.orientationDate}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          orientationDate: e.target.value,
                        }))
                      }
                      className="input-base"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="orientation-notes"
                    className="text-[13px] font-semibold text-ink-800"
                  >
                    Notes
                  </label>
                  <textarea
                    id="orientation-notes"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    rows={2}
                    className="input-base resize-none"
                    placeholder="Optional notes"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    label="Cancel"
                    onClick={() => setShowForm(false)}
                  />
                  <Button type="submit" label="Schedule" />
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <SkeletonList rows={4} />
          ) : records.length === 0 ? (
            <Card padding={false}>
              <EmptyState
                title="No orientation sessions scheduled yet"
                description="Schedule your first orientation session to get new hires up to speed with your team."
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <Card key={record._id} hover>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 text-sm font-semibold ring-1 ring-brand-500/10">
                        {initials(record.employee?.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-ink-900">
                            {record.employee?.name || "Unknown"}
                          </h3>
                          <span
                            className={`chip ${statusStyles[record.orientationStatus] || statusStyles.Scheduled}`}
                          >
                            {record.orientationStatus}
                          </span>
                        </div>
                        <p className="text-xs text-ink-500 mt-0.5">
                          {record.employee?.email} &middot;{" "}
                          {record.employee?.role}
                        </p>
                        {record.orientationDate && (
                          <p className="text-xs text-ink-400 mt-1">
                            Date:{" "}
                            {new Date(
                              record.orientationDate,
                            ).toLocaleDateString()}
                          </p>
                        )}
                        {record.notes && (
                          <p className="text-xs text-ink-500 mt-1 italic">
                            {record.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {record.orientationStatus === "Scheduled" && (
                        <>
                          <Button
                            size="sm"
                            label="Complete"
                            variant="secondary"
                            onClick={() =>
                              updateStatus(record._id, "Completed")
                            }
                          />
                          <Button
                            size="sm"
                            label="Cancel"
                            variant="ghost"
                            onClick={() =>
                              updateStatus(record._id, "Cancelled")
                            }
                          />
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NewEmployeeOrientation;
