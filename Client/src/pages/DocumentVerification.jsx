import { useEffect, useState } from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import Card from "../components/Card";
import Button from "../components/Button";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api } from "../utils/api";

const docStatusStyles = {
  Pending: "bg-amber-50 text-amber-700",
  Verified: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

const DocumentVerification = () => {
  const { user } = useSelector((state) => state.auth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex">
      {SideNav(user?.user?.role)}
      <div className="flex-1 min-h-screen p-6 bg-surface-100">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Document Verification</h1>
          <p className="text-sm text-gray-500 mb-6">Verify employee documents</p>

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
              {records.map((record) => (
                <Card key={record._id}>
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">{record.employee?.name || "Unknown"}</h3>
                    <p className="text-xs text-gray-500">{record.employee?.email}</p>
                  </div>

                  {(!record.documents || record.documents.length === 0) ? (
                    <div className="text-xs text-gray-400 py-2">No documents uploaded yet</div>
                  ) : (
                    <div className="space-y-2">
                      {record.documents.map((doc) => (
                        <div key={doc._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                              {doc.notes && <p className="text-xs text-gray-400">{doc.notes}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${docStatusStyles[doc.status] || docStatusStyles.Pending}`}>
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
      </div>
    </div>
  );
};

export default DocumentVerification;
