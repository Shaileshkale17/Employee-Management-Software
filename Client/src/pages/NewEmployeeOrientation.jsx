import { useEffect, useState } from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import Card from "../components/Card";
import Button from "../components/Button";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api } from "../utils/api";

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

  const SideNav = (role) => {
    switch (role) {
      case "developer":
        return <SideNavbar />;
      case "HR Manager":
        return <HRSideNavber />;
      default:
        return null;
    }
  };

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

  return (
    <div className="flex">
      {SideNav(user?.user?.role)}
      <div className="flex-1 min-h-screen p-6 bg-surface-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                New Employee Orientation
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Schedule and manage orientation sessions
              </p>
            </div>
            <Button
              label="+ Schedule Orientation"
              onClick={() => setShowForm(!showForm)}
            />
          </div>

          {showForm && (
            <Card className="mb-6 animate-fade-in-down">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Employee
                    </label>
                    <select
                      value={form.employee}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, employee: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                    <label className="text-sm font-semibold text-gray-700">
                      Orientation Date
                    </label>
                    <input
                      type="date"
                      value={form.orientationDate}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          orientationDate: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
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
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-5 border border-gray-100"
                >
                  <div className="skeleton h-5 w-1/3 mb-3" />
                  <div className="skeleton h-4 w-1/2 mb-2" />
                  <div className="skeleton h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
              No orientation sessions scheduled yet
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <Card key={record._id}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {record.employee?.name || "Unknown"}
                        </h3>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyles[record.orientationStatus] || statusStyles.Scheduled}`}
                        >
                          {record.orientationStatus}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {record.employee?.email} &middot;{" "}
                        {record.employee?.role}
                      </p>
                      {record.orientationDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          Date:{" "}
                          {new Date(
                            record.orientationDate,
                          ).toLocaleDateString()}
                        </p>
                      )}
                      {record.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          {record.notes}
                        </p>
                      )}
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
      </div>
    </div>
  );
};

export default NewEmployeeOrientation;
