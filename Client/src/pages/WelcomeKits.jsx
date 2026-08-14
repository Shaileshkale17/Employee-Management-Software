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
import { CircleCheck, Files, Package } from "lucide-react";

const kitStyles = {
  Pending: "bg-amber-50 text-amber-700",
  Prepared: "bg-amber-100 text-amber-800",
  Delivered: "bg-emerald-50 text-emerald-700",
};

const WelcomeKits = () => {
  const { user } = useSelector((state) => state.auth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ items: "", notes: "" });

  const SideNav = (role) =>
    ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(role)
      ? <HRSideNavber />
      : <SideNavbar />;

  const fetchRecords = async () => {
    try {
      const res = await api.get("/onboarding/onboarding-all");
      setRecords(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const updateKitStatus = async (id, status, items, notes) => {
    try {
      await api.put(`/onboarding/onboarding-welcomekit/${id}`, { status, items, notes });
      toast.success(`Welcome kit ${status.toLowerCase()}`);
      setEditId(null);
      setEditForm({ items: "", notes: "" });
      fetchRecords();
    } catch {
      toast.error("Failed to update");
    }
  };

  const startEdit = (record) => {
    setEditId(record._id);
    setEditForm({
      items: record.welcomeKit?.items || "",
      notes: record.welcomeKit?.notes || "",
    });
  };

  const pendingCount = records.filter((r) => r.welcomeKit?.status === "Pending" || !r.welcomeKit?.status).length;
  const deliveredCount = records.filter((r) => r.welcomeKit?.status === "Delivered").length;
  const preparedCount = records.filter((r) => r.welcomeKit?.status === "Prepared").length;

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
      {SideNav(user?.user?.role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="animate-fade-in-down">
            <Heading
              heading="Welcome Kits"
              subtitle="Manage welcome kit preparation and delivery"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in-up">
            <StatCard
              label="Pending"
              value={pendingCount}
              color="amber"
              icon={<Package className="h-5 w-5" />}
            />
            <StatCard
              label="Prepared"
              value={preparedCount}
              color="amber"
              icon={<Files className="h-5 w-5" />}
            />
            <StatCard
              label="Delivered"
              value={deliveredCount}
              color="green"
              icon={<CircleCheck className="h-5 w-5" />}
            />
          </div>

          {loading ? (
            <SkeletonList rows={4} />
          ) : records.length === 0 ? (
            <Card padding={false}>
              <EmptyState
                title="No onboarding records found"
                description="Welcome kits will appear here once onboarding records are created."
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {records.map((record) => {
                const kit = record.welcomeKit || { status: "Pending", items: "" };
                return (
                  <Card key={record._id} hover className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 text-sm font-semibold ring-1 ring-brand-500/10">
                          {initials(record.employee?.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-ink-900 truncate">{record.employee?.name || "Unknown"}</h3>
                          <p className="text-xs text-ink-500 mt-0.5 truncate">{record.employee?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`chip ${kitStyles[kit.status] || kitStyles.Pending}`}>
                          {kit.status}
                        </span>
                        {kit.status !== "Delivered" && (
                          <>
                            {kit.status === "Pending" && (
                              <Button
                                size="sm"
                                label="Prepare"
                                variant="secondary"
                                onClick={() => {
                                  setEditForm({ items: "", notes: "" });
                                  updateKitStatus(record._id, "Prepared", editForm.items || "Laptop, ID Card, Welcome Kit", "");
                                }}
                              />
                            )}
                            {kit.status === "Prepared" && (
                              <Button size="sm" label="Mark Delivered" onClick={() => updateKitStatus(record._id, "Delivered", kit.items, kit.notes)} />
                            )}
                          </>
                        )}
                        <Button size="sm" label="Edit" variant="ghost" onClick={() => startEdit(record)} />
                      </div>
                    </div>

                    {kit.items && (
                      <p className="text-xs text-ink-600"><span className="font-medium">Items:</span> {kit.items}</p>
                    )}
                    {kit.notes && (
                      <p className="text-xs text-ink-400 italic">{kit.notes}</p>
                    )}

                    {editId === record._id && (
                      <div className="panel-inner p-4 space-y-2.5 animate-fade-in-down">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor={`kit-items-${record._id}`} className="text-[13px] font-semibold text-ink-800">
                            Kit items
                          </label>
                          <input
                            id={`kit-items-${record._id}`}
                            type="text"
                            placeholder="Kit items (e.g. Laptop, ID card, Swag)"
                            value={editForm.items}
                            onChange={(e) => setEditForm((p) => ({ ...p, items: e.target.value }))}
                            className="input-base"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor={`kit-notes-${record._id}`} className="text-[13px] font-semibold text-ink-800">
                            Notes
                          </label>
                          <textarea
                            id={`kit-notes-${record._id}`}
                            placeholder="Notes"
                            value={editForm.notes}
                            onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                            rows={2}
                            className="input-base resize-none"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" label="Cancel" variant="ghost" onClick={() => setEditId(null)} />
                          <Button size="sm" label="Save" onClick={() => updateKitStatus(record._id, kit.status, editForm.items, editForm.notes)} />
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WelcomeKits;
