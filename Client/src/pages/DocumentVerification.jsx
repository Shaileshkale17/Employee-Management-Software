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
import { CircleCheck, Clock, FileText } from "lucide-react";

const docStatusStyles = {
  Pending: "bg-amber-50 text-amber-700",
  Verified: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

const DocumentVerification = () => {
  const { user } = useSelector((state) => state.auth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const SideNav = (role) =>
    ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(role)
      ? <HRSideNavber />
      : <SideNavbar />;

  const fetchRecords = async () => {
    try {
      const res = await api.get("/onboarding/onboarding-all");
      const withDocs = res.data.data.filter((r) => r.documents?.length > 0);
      setRecords(withDocs.length > 0 ? res.data.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const updateDocStatus = async (recordId, docId, status) => {
    try {
      await api.put(`/onboarding/onboarding-doc/${recordId}/${docId}`, { status });
      toast.success(`Document ${status.toLowerCase()}`);
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

  const totalDocs = records.reduce(
    (acc, r) => acc + (r.documents?.length || 0),
    0,
  );
  const verifiedDocs = records.reduce(
    (acc, r) => acc + (r.documents?.filter((d) => d.status === "Verified")?.length || 0),
    0,
  );
  const pendingDocs = records.reduce(
    (acc, r) => acc + (r.documents?.filter((d) => d.status === "Pending")?.length || 0),
    0,
  );

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(user?.user?.role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="animate-fade-in-down">
            <Heading
              heading="Document Verification"
              subtitle="Verify employee documents"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in-up">
            <StatCard
              label="Total Documents"
              value={totalDocs}
              color="brand"
              icon={<FileText className="h-5 w-5" />}
            />
            <StatCard
              label="Verified"
              value={verifiedDocs}
              color="green"
              icon={<CircleCheck className="h-5 w-5" />}
            />
            <StatCard
              label="Pending Review"
              value={pendingDocs}
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
                description="Onboarding records with uploaded documents will appear here for verification."
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <Card key={record._id} hover className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 text-sm font-semibold ring-1 ring-brand-500/10">
                      {initials(record.employee?.name)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-ink-900">{record.employee?.name || "Unknown"}</h3>
                      <p className="text-xs text-ink-500 mt-0.5">{record.employee?.email}</p>
                    </div>
                  </div>

                  {(!record.documents || record.documents.length === 0) ? (
                    <div className="text-xs text-ink-400 py-2">No documents uploaded yet</div>
                  ) : (
                    <div className="space-y-2">
                      {record.documents.map((doc) => (
                        <div key={doc._id} className="panel-inner flex items-center justify-between gap-3 p-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-5 h-5 text-ink-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink-800 truncate">{doc.name}</p>
                              {doc.notes && <p className="text-xs text-ink-400 mt-0.5 truncate">{doc.notes}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`chip ${docStatusStyles[doc.status] || docStatusStyles.Pending}`}>
                              {doc.status}
                            </span>
                            {doc.status === "Pending" && (
                              <>
                                <Button size="sm" label="Verify" variant="secondary" onClick={() => updateDocStatus(record._id, doc._id, "Verified")} />
                                <Button size="sm" label="Reject" variant="ghost" onClick={() => updateDocStatus(record._id, doc._id, "Rejected")} />
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DocumentVerification;
