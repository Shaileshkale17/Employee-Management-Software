import { useState, useEffect } from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api } from "../utils/api";

const statusOptions = ["Applied", "Screening", "Shortlisted", "Interview", "Offer", "Hired", "Rejected"];

const statusColors = {
  Applied: "bg-blue-50 text-blue-700",
  Screening: "bg-yellow-50 text-yellow-700",
  Shortlisted: "bg-purple-50 text-purple-700",
  Interview: "bg-indigo-50 text-indigo-700",
  Offer: "bg-green-50 text-green-700",
  Hired: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-600",
};

const ResumeScreening = () => {
  const { user } = useSelector((state) => state.auth);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [jobFilter, setJobFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ candidateName: "", candidateEmail: "", candidatePhone: "", candidateSkills: "", candidateExperience: "", jobId: "", notes: "" });
  const [selectedApp, setSelectedApp] = useState(null);

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
      const [appRes, jobRes] = await Promise.all([
        api.get("/application/all"),
        api.get("/job/all"),
      ]);
      setApplications(appRes.data?.data?.data || []);
      setJobs(jobRes.data?.data?.data || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/application/update-status/${id}`, { status });
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    try {
      const candRes = await api.post("/candidate/create", {
        firstName: formData.candidateName.split(" ")[0] || formData.candidateName,
        lastName: formData.candidateName.split(" ").slice(1).join(" ") || "",
        email: formData.candidateEmail,
        phone: formData.candidatePhone,
        skills: formData.candidateSkills.split(",").map((s) => s.trim()).filter(Boolean),
        experience: formData.candidateExperience,
      });
      await api.post("/application/create", {
        job: formData.jobId,
        candidate: candRes.data?.data?._id,
        notes: formData.notes,
      });
      toast.success("Candidate added and application created");
      setShowModal(false);
      setFormData({ candidateName: "", candidateEmail: "", candidatePhone: "", candidateSkills: "", candidateExperience: "", jobId: "", notes: "" });
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add candidate");
    }
  };

  const filteredApps = applications.filter((app) => {
    if (statusFilter !== "All" && app.status !== statusFilter) return false;
    if (jobFilter !== "All" && app.job?._id !== jobFilter) return false;
    return true;
  });

  return (
    <div className="flex">
      {SideNav(user?.user?.role)}
      <div className="flex-1 min-h-screen p-6 bg-surface-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-xl font-bold text-gray-900">Resume Screening</h1>
          <button onClick={() => setShowModal(true)} className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20">
            + Add Candidate
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
            <option value="All">All Statuses</option>
            {statusOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
          <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
            <option value="All">All Jobs</option>
            {jobs.map((j) => (<option key={j._id} value={j._id}>{j.title}</option>))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 animate-pulse flex gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-sm">No applications found</div>
        ) : (
          <div className="space-y-3">
            {filteredApps.map((app) => (
              <div key={app._id} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 hover:shadow-card-hover transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-sm flex-shrink-0">
                      {app.candidate?.firstName?.[0]}{app.candidate?.lastName?.[0]}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{app.candidate?.firstName} {app.candidate?.lastName}</h3>
                      <p className="text-xs text-gray-500">{app.candidate?.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {app.job?.title} &middot; Applied {new Date(app.appliedDate || app.createdAt).toLocaleDateString()}
                      </p>
                      {app.candidate?.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {app.candidate.skills.map((s, i) => (
                            <span key={i} className="bg-gray-50 text-gray-500 text-[10px] px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[app.status]}`}>
                      {app.status}
                    </span>
                    <div className="relative group">
                      <button onClick={() => setSelectedApp(selectedApp?._id === app._id ? null : app)} className="text-xs text-gray-400 hover:text-brand-600 p-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      {selectedApp?._id === app._id && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-modal border border-gray-100 py-1 z-10 min-w-[140px]">
                          {statusOptions.map((s) => (
                            <button key={s} onClick={() => { handleUpdateStatus(app._id, s); setSelectedApp(null); }} className="block w-full text-left px-4 py-1.5 text-xs text-gray-600 hover:bg-brand-50 hover:text-brand-700">
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {app.notes && (
                  <p className="text-xs text-gray-400 mt-2 ml-[52px] italic">{app.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Candidate & Apply</h2>
              <form onSubmit={handleAddCandidate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                    <input name="candidateName" value={formData.candidateName} onChange={(e) => setFormData((p) => ({ ...p, candidateName: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input type="email" name="candidateEmail" value={formData.candidateEmail} onChange={(e) => setFormData((p) => ({ ...p, candidateEmail: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input name="candidatePhone" value={formData.candidatePhone} onChange={(e) => setFormData((p) => ({ ...p, candidatePhone: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Experience</label>
                    <input name="candidateExperience" value={formData.candidateExperience} onChange={(e) => setFormData((p) => ({ ...p, candidateExperience: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Skills (comma-separated)</label>
                  <input name="candidateSkills" value={formData.candidateSkills} onChange={(e) => setFormData((p) => ({ ...p, candidateSkills: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Job</label>
                  <select name="jobId" value={formData.jobId} onChange={(e) => setFormData((p) => ({ ...p, jobId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none" required>
                    <option value="">Select job...</option>
                    {jobs.map((j) => (<option key={j._id} value={j._id}>{j.title} - {j.location}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="bg-brand-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">Add & Apply</button>
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

export default ResumeScreening;
