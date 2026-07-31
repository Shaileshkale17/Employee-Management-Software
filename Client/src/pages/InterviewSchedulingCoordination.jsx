import { useState, useEffect } from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api } from "../utils/api";

const modeOptions = ["In-person", "Video Call", "Phone"];
const typeOptions = ["Technical", "HR", "Managerial", "Final"];

const statusColors = {
  Scheduled: "bg-blue-50 text-blue-700",
  Completed: "bg-green-50 text-green-700",
  Cancelled: "bg-red-50 text-red-600",
  Rescheduled: "bg-yellow-50 text-yellow-700",
};

const InterviewSchedulingCoordination = () => {
  const { user } = useSelector((state) => state.auth);
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ applicationId: "", interviewDate: "", mode: "Video Call", type: "Technical", panelMembers: "" });

  const SideNav = (role) => {
    switch (role) {
      case "developer": return <SideNavbar />;
      case "HR Manager": return <HRSideNavber />;
      default: return null;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [intRes, appRes] = await Promise.all([
        api.get("/interview/all"),
        api.get("/application/all"),
      ]);
      setInterviews(intRes.data?.data?.data || []);
      setApplications(appRes.data?.data?.data || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!formData.applicationId || !formData.interviewDate) {
      toast.error("Application and date are required");
      return;
    }
    try {
      const app = applications.find((a) => a._id === formData.applicationId);
      if (!app) { toast.error("Application not found"); return; }
      const payload = {
        candidate: app.candidate?._id,
        job: app.job?._id,
        application: formData.applicationId,
        interviewDate: formData.interviewDate,
        mode: formData.mode,
        type: formData.type,
      };
      await api.post("/interview/create", payload);
      toast.success("Interview scheduled");
      setShowModal(false);
      setFormData({ applicationId: "", interviewDate: "", mode: "Video Call", type: "Technical", panelMembers: "" });
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to schedule");
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.put(`/interview/update/${id}`, { status: "Cancelled" });
      toast.success("Interview cancelled");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel");
    }
  };

  const shortlistedApps = applications.filter((a) => a.status === "Shortlisted" || a.status === "Interview");

  return (
    <div className="flex">
      {SideNav(user?.user?.role)}
      <div className="flex-1 min-h-screen p-6 bg-surface-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-xl font-bold text-gray-900">Interview Scheduling & Coordination</h1>
          <button onClick={() => setShowModal(true)} className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20">
            + Schedule Interview
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : interviews.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-sm">No interviews scheduled yet</div>
        ) : (
          <div className="space-y-3">
            {interviews.map((int) => (
              <div key={int._id} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 hover:shadow-card-hover transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-sm flex-shrink-0">
                      {int.candidate?.firstName?.[0]}{int.candidate?.lastName?.[0]}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{int.candidate?.firstName} {int.candidate?.lastName}</h3>
                      <p className="text-xs text-gray-500">{int.job?.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(int.interviewDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{int.mode}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{int.type}</span>
                      </div>
                      {int.feedback && (
                        <p className="text-xs text-gray-400 mt-1 italic">{int.feedback}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[int.status]}`}>
                      {int.status}
                    </span>
                    {int.result && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${int.result === "Pass" ? "bg-green-50 text-green-700" : int.result === "Fail" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-700"}`}>
                        {int.result}
                      </span>
                    )}
                    {int.status === "Scheduled" && (
                      <button onClick={() => handleCancel(int._id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Interview</h2>
              <form onSubmit={handleSchedule} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Candidate (Application)</label>
                  <select value={formData.applicationId} onChange={(e) => setFormData((p) => ({ ...p, applicationId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none" required>
                    <option value="">Select shortlisted candidate...</option>
                    {shortlistedApps.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.candidate?.firstName} {a.candidate?.lastName} - {a.job?.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date & Time</label>
                  <input type="datetime-local" value={formData.interviewDate} onChange={(e) => setFormData((p) => ({ ...p, interviewDate: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mode</label>
                    <select value={formData.mode} onChange={(e) => setFormData((p) => ({ ...p, mode: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                      {modeOptions.map((m) => (<option key={m} value={m}>{m}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                    <select value={formData.type} onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                      {typeOptions.map((t) => (<option key={t} value={t}>{t}</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Panel Members (names, comma-separated)</label>
                  <input value={formData.panelMembers} onChange={(e) => setFormData((p) => ({ ...p, panelMembers: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none" placeholder="e.g. John Doe, Jane Smith" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="bg-brand-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">Schedule</button>
                  <button type="button" onClick={() => setShowModal(false)} className="bg-white text-gray-600 px-5 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewSchedulingCoordination;
