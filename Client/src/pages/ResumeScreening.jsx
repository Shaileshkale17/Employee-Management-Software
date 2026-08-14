import { useState, useEffect } from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api } from "../utils/api";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";
import { ChevronDown, X } from "lucide-react";

const statusOptions = ["Applied", "Screening", "Shortlisted", "Interview", "Offer", "Hired", "Rejected"];

const statusColors = {
  Applied: "bg-purple-50 text-purple-700",
  Screening: "bg-yellow-50 text-yellow-700",
  Shortlisted: "bg-purple-50 text-purple-700",
  Interview: "bg-indigo-50 text-indigo-700",
  Offer: "bg-green-50 text-green-700",
  Hired: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-600",
};

const selectChevron = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a94a6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
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

  const SideNav = (role) =>
    ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(role)
      ? <HRSideNavber />
      : <SideNavbar />;

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
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(user?.user?.role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-down">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
                Resume Screening
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                Review applications and move candidates through your pipeline
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary btn-lg w-full sm:w-auto"
            >
              + Add Candidate
            </button>
          </div>

          <div className="flex flex-wrap gap-3 animate-fade-in">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="input-base appearance-none cursor-pointer pr-10 sm:w-auto"
              style={selectChevron}
            >
              <option value="All">All Statuses</option>
              {statusOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              aria-label="Filter by job"
              className="input-base appearance-none cursor-pointer pr-10 sm:w-auto"
              style={selectChevron}
            >
              <option value="All">All Jobs</option>
              {jobs.map((j) => (<option key={j._id} value={j._id}>{j.title}</option>))}
            </select>
          </div>

          {loading ? (
            <SkeletonList rows={4} />
          ) : filteredApps.length === 0 ? (
            <div className="card-surface animate-fade-in">
              <EmptyState
                title="No applications found"
                description="Applications will appear here once candidates apply to your posted jobs."
              />
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in-up">
              {filteredApps.map((app) => (
                <div key={app._id} className="card-surface card-hover p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
                        {app.candidate?.firstName?.[0]}{app.candidate?.lastName?.[0]}
                      </div>
                      <div>
                        <h3 className="font-medium text-ink-900">{app.candidate?.firstName} {app.candidate?.lastName}</h3>
                        <p className="text-xs text-ink-500">{app.candidate?.email}</p>
                        <p className="mt-0.5 text-xs text-ink-400">
                          {app.job?.title} &middot; Applied {new Date(app.appliedDate || app.createdAt).toLocaleDateString()}
                        </p>
                        {app.candidate?.skills?.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {app.candidate.skills.map((s, i) => (
                              <span key={i} className="rounded-md bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-ink-600 ring-1 ring-ink-200/60">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className={`chip ring-1 ring-ink-950/5 ${statusColors[app.status]}`}>
                        {app.status}
                      </span>
                      <div className="relative group">
                        <button
                          onClick={() => setSelectedApp(selectedApp?._id === app._id ? null : app)}
                          aria-label={`Change status for ${app.candidate?.firstName} ${app.candidate?.lastName}`}
                          className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors duration-200 hover:bg-surface-100 hover:text-brand-600"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        {selectedApp?._id === app._id && (
                          <div className="absolute right-0 top-full z-10 mt-1 min-w-[150px] overflow-hidden rounded-xl border border-ink-200/60 bg-white py-1 shadow-popover animate-pop">
                            {statusOptions.map((s) => (
                              <button key={s} onClick={() => { handleUpdateStatus(app._id, s); setSelectedApp(null); }} className="block w-full px-4 py-1.5 text-left text-xs text-ink-600 transition-colors duration-150 hover:bg-brand-50 hover:text-brand-700">
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {app.notes && (
                    <p className="ml-[52px] mt-2 text-xs italic text-ink-400">{app.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
              <div className="card-surface w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-ink-950">Add Candidate & Apply</h2>
                    <p className="mt-0.5 text-xs text-ink-400">Create a candidate profile and attach it to a job opening</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    aria-label="Close modal"
                    className="focus-ring flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors duration-200 hover:bg-surface-100 hover:text-ink-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleAddCandidate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="candidateName" className="mb-1 block text-xs font-medium text-ink-600">Full Name</label>
                      <input id="candidateName" name="candidateName" value={formData.candidateName} onChange={(e) => setFormData((p) => ({ ...p, candidateName: e.target.value }))} className="input-base" required />
                    </div>
                    <div>
                      <label htmlFor="candidateEmail" className="mb-1 block text-xs font-medium text-ink-600">Email</label>
                      <input id="candidateEmail" type="email" name="candidateEmail" value={formData.candidateEmail} onChange={(e) => setFormData((p) => ({ ...p, candidateEmail: e.target.value }))} className="input-base" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="candidatePhone" className="mb-1 block text-xs font-medium text-ink-600">Phone</label>
                      <input id="candidatePhone" name="candidatePhone" value={formData.candidatePhone} onChange={(e) => setFormData((p) => ({ ...p, candidatePhone: e.target.value }))} className="input-base" />
                    </div>
                    <div>
                      <label htmlFor="candidateExperience" className="mb-1 block text-xs font-medium text-ink-600">Experience</label>
                      <input id="candidateExperience" name="candidateExperience" value={formData.candidateExperience} onChange={(e) => setFormData((p) => ({ ...p, candidateExperience: e.target.value }))} className="input-base" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="candidateSkills" className="mb-1 block text-xs font-medium text-ink-600">Skills (comma-separated)</label>
                    <input id="candidateSkills" name="candidateSkills" value={formData.candidateSkills} onChange={(e) => setFormData((p) => ({ ...p, candidateSkills: e.target.value }))} className="input-base" />
                  </div>
                  <div>
                    <label htmlFor="jobId" className="mb-1 block text-xs font-medium text-ink-600">Job</label>
                    <select id="jobId" name="jobId" value={formData.jobId} onChange={(e) => setFormData((p) => ({ ...p, jobId: e.target.value }))} className="input-base appearance-none cursor-pointer pr-10" style={selectChevron} required>
                      <option value="">Select job...</option>
                      {jobs.map((j) => (<option key={j._id} value={j._id}>{j.title} - {j.location}</option>))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="notes" className="mb-1 block text-xs font-medium text-ink-600">Notes</label>
                    <textarea id="notes" name="notes" value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} rows={2} className="input-base resize-none" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="btn-primary btn-md">Add & Apply</button>
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

export default ResumeScreening;
