import { useState, useEffect } from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api } from "../utils/api";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";
import { X } from "lucide-react";

const modeOptions = ["In-person", "Video Call", "Phone"];
const typeOptions = ["Technical", "HR", "Managerial", "Final"];

const statusColors = {
  Scheduled: "bg-purple-50 text-purple-700",
  Completed: "bg-green-50 text-green-700",
  Cancelled: "bg-red-50 text-red-600",
  Rescheduled: "bg-yellow-50 text-yellow-700",
};

const selectChevron = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a94a6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
};

const InterviewSchedulingCoordination = () => {
  const { user } = useSelector((state) => state.auth);
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ applicationId: "", interviewDate: "", mode: "Video Call", type: "Technical", panelMembers: "" });

  const SideNav = (role) =>
    ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(role)
      ? <HRSideNavber />
      : <SideNavbar />;

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
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(user?.user?.role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-down">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
                Interview Scheduling & Coordination
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                Schedule, coordinate and track interviews across your team
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary btn-lg w-full sm:w-auto"
            >
              + Schedule Interview
            </button>
          </div>

          {loading ? (
            <SkeletonList rows={4} />
          ) : interviews.length === 0 ? (
            <div className="card-surface animate-fade-in">
              <EmptyState
                title="No interviews scheduled yet"
                description="Schedule your first interview from a shortlisted candidate."
              />
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in-up">
              {interviews.map((int) => (
                <div key={int._id} className="card-surface card-hover p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
                        {int.candidate?.firstName?.[0]}{int.candidate?.lastName?.[0]}
                      </div>
                      <div>
                        <h3 className="font-medium text-ink-900">{int.candidate?.firstName} {int.candidate?.lastName}</h3>
                        <p className="text-xs text-ink-500">{int.job?.title}</p>
                        <p className="mt-0.5 text-xs text-ink-400">
                          {new Date(int.interviewDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="chip bg-surface-100 text-ink-600 ring-1 ring-ink-200/60">{int.mode}</span>
                          <span className="chip bg-surface-100 text-ink-600 ring-1 ring-ink-200/60">{int.type}</span>
                        </div>
                        {int.feedback && (
                          <p className="mt-1 text-xs italic text-ink-400">{int.feedback}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className={`chip ring-1 ring-ink-950/5 ${statusColors[int.status]}`}>
                        {int.status}
                      </span>
                      {int.result && (
                        <span className={`chip ring-1 ${int.result === "Pass" ? "bg-green-50 text-green-700 ring-green-500/20" : int.result === "Fail" ? "bg-red-50 text-red-600 ring-red-500/20" : "bg-yellow-50 text-yellow-700 ring-yellow-500/20"}`}>
                          {int.result}
                        </span>
                      )}
                      {int.status === "Scheduled" && (
                        <button
                          onClick={() => handleCancel(int._id)}
                          className="focus-ring rounded-md px-2 py-1 text-xs font-medium text-red-500 transition-colors duration-200 hover:text-red-600"
                        >
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
              <div className="card-surface max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-ink-950">Schedule Interview</h2>
                    <p className="mt-0.5 text-xs text-ink-400">Pick a shortlisted candidate and a time slot</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    aria-label="Close modal"
                    className="focus-ring flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors duration-200 hover:bg-surface-100 hover:text-ink-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleSchedule} className="space-y-4">
                  <div>
                    <label htmlFor="applicationId" className="mb-1 block text-xs font-medium text-ink-600">Candidate (Application)</label>
                    <select id="applicationId" value={formData.applicationId} onChange={(e) => setFormData((p) => ({ ...p, applicationId: e.target.value }))} className="input-base appearance-none cursor-pointer pr-10" style={selectChevron} required>
                      <option value="">Select shortlisted candidate...</option>
                      {shortlistedApps.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.candidate?.firstName} {a.candidate?.lastName} - {a.job?.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="interviewDate" className="mb-1 block text-xs font-medium text-ink-600">Date & Time</label>
                    <input id="interviewDate" type="datetime-local" value={formData.interviewDate} onChange={(e) => setFormData((p) => ({ ...p, interviewDate: e.target.value }))} className="input-base" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="mode" className="mb-1 block text-xs font-medium text-ink-600">Mode</label>
                      <select id="mode" value={formData.mode} onChange={(e) => setFormData((p) => ({ ...p, mode: e.target.value }))} className="input-base appearance-none cursor-pointer pr-10" style={selectChevron}>
                        {modeOptions.map((m) => (<option key={m} value={m}>{m}</option>))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="type" className="mb-1 block text-xs font-medium text-ink-600">Type</label>
                      <select id="type" value={formData.type} onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))} className="input-base appearance-none cursor-pointer pr-10" style={selectChevron}>
                        {typeOptions.map((t) => (<option key={t} value={t}>{t}</option>))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="panelMembers" className="mb-1 block text-xs font-medium text-ink-600">Panel Members (names, comma-separated)</label>
                    <input id="panelMembers" value={formData.panelMembers} onChange={(e) => setFormData((p) => ({ ...p, panelMembers: e.target.value }))} className="input-base" placeholder="e.g. John Doe, Jane Smith" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="btn-primary btn-md">Schedule</button>
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary btn-md">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InterviewSchedulingCoordination;
