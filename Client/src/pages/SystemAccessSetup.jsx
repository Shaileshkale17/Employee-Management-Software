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
import { CircleCheck, Clock, Lock, Monitor } from "lucide-react";

const accessStyles = {
  Pending: "bg-amber-50 text-amber-700",
  Granted: "bg-emerald-50 text-emerald-700",
  Revoked: "bg-ink-100 text-ink-600",
};

const SystemAccessSetup = () => {
  const { user } = useSelector((state) => state.auth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [newSystem, setNewSystem] = useState("");

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
  const pendingSystems = records.reduce((acc, r) => acc + (r.systemAccess?.filter((a) => a.status === "Pending")?.length || 0), 0);

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(user?.user?.role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="animate-fade-in-down">
            <Heading
              heading="System Access Setup"
              subtitle="Manage system access for new employees"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in-up">
            <StatCard
              label="Total Systems"
              value={totalSystems}
              color="brand"
              icon={<Monitor className="h-5 w-5" />}
            />
            <StatCard
              label="Granted"
              value={grantedSystems}
              color="green"
              icon={<CircleCheck className="h-5 w-5" />}
            />
            <StatCard
              label="Pending"
              value={pendingSystems}
              color="amber"
              icon={<Clock className="h-5 w-5" />}
            />
          </div>

          {loading ? (
            <SkeletonList rows={4} />
          ) : records.length === 0 ? (
            <Card padding={false}>
              <EmptyState
                title="No onboarding records found"
                description="Schedule an orientation first to start assigning system access to new employees."
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {records.map((record) => {
                const accessList = record.systemAccess || [];
                return (
                  <Card key={record._id} hover className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 text-sm font-semibold ring-1 ring-brand-500/10">
                        {record.employee?.name?.split(" ").map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "?"}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-ink-900">{record.employee?.name || "Unknown"}</h3>
                        <p className="text-xs text-ink-500 mt-0.5">{record.employee?.email} &middot; {record.employee?.role}</p>
                      </div>
                    </div>

                    {accessList.length > 0 && (
                      <div className="space-y-2">
                        {accessList.map((access) => (
                          <div key={access._id} className="panel-inner flex items-center justify-between gap-3 p-3.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <Lock className="w-5 h-5 text-ink-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-ink-800 truncate">{access.system}</p>
                                {access.notes && <p className="text-xs text-ink-400 mt-0.5 truncate">{access.notes}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`chip ${accessStyles[access.status] || accessStyles.Pending}`}>
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
                        className="input-base flex-1"
                      />
                      <Button size="sm" label="Add" variant="secondary" onClick={() => addSystemAccess(record._id)} disabled={!newSystem.trim()} />
                    </div>
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

export default SystemAccessSetup;
