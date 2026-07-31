import { useEffect, useState } from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import Card from "../components/Card";
import Button from "../components/Button";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api } from "../utils/api";

const accessStyles = {
  Pending: "bg-amber-50 text-amber-700",
  Granted: "bg-emerald-50 text-emerald-700",
  Revoked: "bg-red-50 text-red-700",
};

const SystemAccessSetup = () => {
  const { user } = useSelector((state) => state.auth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [newSystem, setNewSystem] = useState("");

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

  const updateAccess = async (recordId, accessId, status) => {
    try {
      await api.put(`/onboarding/onboarding-access/${recordId}/${accessId}`, { status });
      toast.success(`Access ${status.toLowerCase()}`);
      setSelectedRecord(null);
      fetchRecords();
    } catch {
      toast.error("Failed to update");
    }
  };

  const addSystemAccess = async (recordId) => {
    if (!newSystem.trim()) return;
    try {
      const record = records.find((r) => r._id === recordId);
      const updatedAccess = [...(record.systemAccess || []), { system: newSystem.trim(), status: "Pending" }];
      await api.put(`/onboarding/onboarding-update/${recordId}`, { systemAccess: updatedAccess });
      toast.success("System access added");
      setNewSystem("");
      fetchRecords();
    } catch {
      toast.error("Failed to add");
    }
  };

  const totalSystems = records.reduce((acc, r) => acc + (r.systemAccess?.length || 0), 0);
  const grantedSystems = records.reduce((acc, r) => acc + (r.systemAccess?.filter((a) => a.status === "Granted")?.length || 0), 0);

  return (
    <div className="flex">
      {SideNav(user?.user?.role)}
      <div className="flex-1 min-h-screen p-6 bg-surface-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">System Access Setup</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage system access for new employees</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">Granted: <strong className="text-emerald-600">{grantedSystems}</strong></span>
              <span className="text-gray-500">Total: <strong>{totalSystems}</strong></span>
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
              No onboarding records found. Schedule an orientation first.
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => {
                const accessList = record.systemAccess || [];
                return (
                  <Card key={record._id}>
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">{record.employee?.name || "Unknown"}</h3>
                      <p className="text-xs text-gray-500">{record.employee?.email} &middot; {record.employee?.role}</p>
                    </div>

                    {accessList.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {accessList.map((access) => (
                          <div key={access._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-gray-700">{access.system}</p>
                                {access.notes && <p className="text-xs text-gray-400">{access.notes}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${accessStyles[access.status] || accessStyles.Pending}`}>
                                {access.status}
                              </span>
                              {access.status === "Pending" && (
                                <>
                                  <Button size="sm" label="Grant" variant="secondary" onClick={() => selectedRecord === access._id ? setSelectedRecord(null) : setSelectedRecord(access._id)} />
                                  {selectedRecord === access._id && (
                                    <Button size="sm" label="Confirm Grant" onClick={() => updateAccess(record._id, access._id, "Granted")} />
                                  )}
                                </>
                              )}
                              {access.status === "Granted" && (
                                <Button size="sm" label="Revoke" variant="ghost" onClick={() => updateAccess(record._id, access._id, "Revoked")} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add system (e.g. Email, VPN, Slack)"
                        value={selectedRecord === `input-${record._id}` ? newSystem : ""}
                        onChange={(e) => { setNewSystem(e.target.value); setSelectedRecord(`input-${record._id}`); }}
                        onFocus={() => setSelectedRecord(`input-${record._id}`)}
                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      />
                      <Button size="sm" label="Add" variant="secondary" onClick={() => addSystemAccess(record._id)} disabled={!newSystem.trim()} />
                    </div>
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

export default SystemAccessSetup;
