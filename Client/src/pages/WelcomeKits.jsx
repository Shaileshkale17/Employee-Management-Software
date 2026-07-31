import { useEffect, useState } from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import Card from "../components/Card";
import Button from "../components/Button";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api } from "../utils/api";

const kitStyles = {
  Pending: "bg-amber-50 text-amber-700",
  Prepared: "bg-blue-50 text-blue-700",
  Delivered: "bg-emerald-50 text-emerald-700",
};

const WelcomeKits = () => {
  const { user } = useSelector((state) => state.auth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ items: "", notes: "" });

  const SideNav = (role) => {
    switch (role) {
      case "developer": return <SideNavbar />;
      case "HR Manager": return <HRSideNavber />;
      default: return null;
    }
  };

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

  return (
    <div className="flex">
      {SideNav(user?.user?.role)}
      <div className="flex-1 min-h-screen p-6 bg-surface-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Welcome Kits</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage welcome kit preparation and delivery</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">Pending: <strong className="text-amber-600">{pendingCount}</strong></span>
              <span className="text-gray-500">Delivered: <strong className="text-emerald-600">{deliveredCount}</strong></span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
                  <div className="skeleton h-5 w-1/3 mb-3" />
                  <div className="skeleton h-4 w-1/2 mb-2" />
                  <div className="skeleton h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
              No onboarding records found
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => {
                const kit = record.welcomeKit || { status: "Pending", items: "" };
                return (
                  <Card key={record._id}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{record.employee?.name || "Unknown"}</h3>
                        <p className="text-xs text-gray-500">{record.employee?.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${kitStyles[kit.status] || kitStyles.Pending}`}>
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
                      <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Items:</span> {kit.items}</p>
                    )}
                    {kit.notes && (
                      <p className="text-xs text-gray-400 italic">{kit.notes}</p>
                    )}

                    {editId === record._id && (
                      <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-2 animate-fade-in-down">
                        <input
                          type="text"
                          placeholder="Kit items (e.g. Laptop, ID card, Swag)"
                          value={editForm.items}
                          onChange={(e) => setEditForm((p) => ({ ...p, items: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                        />
                        <textarea
                          placeholder="Notes"
                          value={editForm.notes}
                          onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
                        />
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
      </div>
    </div>
  );
};

export default WelcomeKits;
