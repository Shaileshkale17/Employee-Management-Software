import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { api } from "../utils/api";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = user?.user?.role;
  const canManage = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(role);
  const SideNav = (r) => {
    if (r === "developer" || r === "Employee" || r === "Interviewer") return <SideNavbar />;
    if (canManage) return <HRSideNavber />;
    return null;
  };

  useEffect(() => {
    api.get(`/candidate/show/${id}`)
      .then((res) => setCandidate(res.data.data))
      .catch(() => toast.error("Failed to load candidate"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this candidate and their applications?")) return;
    try {
      await api.delete(`/candidate/delete/${id}`);
      toast.success("Candidate deleted");
      navigate("/ats");
    } catch {
      toast.error("Failed to delete candidate");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-surface-100">
        {SideNav(role)}
        <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="skeleton h-4 w-28" />
            <div className="card-surface p-6">
              <div className="flex items-center gap-4">
                <div className="skeleton h-14 w-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-6 w-48" />
                  <div className="skeleton h-4 w-64" />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="card-surface p-5">
                <div className="skeleton mb-3 h-4 w-24" />
                <div className="skeleton h-24 w-full" />
              </div>
              <div className="card-surface p-5 lg:col-span-2">
                <div className="skeleton mb-3 h-4 w-24" />
                <div className="skeleton h-24 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex min-h-screen bg-surface-100">
        {SideNav(role)}
        <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
          <div className="mx-auto max-w-7xl">
            <div className="card-surface animate-fade-in">
              <EmptyState
                title="Candidate not found"
                description="This candidate may have been removed or the link is incorrect."
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const apps = candidate.applications || [];

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-7xl space-y-6">
          <Link
            to="/ats"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors duration-200 hover:text-brand-600 animate-fade-in"
          >
            <span className="transition-transform duration-200 group-hover:-translate-x-0.5">←</span>
            Back to ATS
          </Link>

          <div className="card-surface p-6 animate-fade-in-up">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-semibold text-white">
                  {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
                    {candidate.firstName} {candidate.lastName}
                  </h1>
                  <p className="text-sm text-ink-500">{candidate.email}</p>
                  {candidate.phone && <p className="text-xs text-ink-400">{candidate.phone}</p>}
                </div>
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" label="Edit" onClick={() => navigate(`/candidates/${id}/edit`)} />
                  <Button variant="danger" size="sm" label="Delete" onClick={handleDelete} />
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="panel-inner p-3">
                <p className="text-[11px] text-ink-400">Experience</p>
                <p className="text-sm font-medium text-ink-800">{candidate.experience || "—"}</p>
              </div>
              <div className="panel-inner p-3">
                <p className="text-[11px] text-ink-400">Education</p>
                <p className="truncate text-sm font-medium text-ink-800">{candidate.education || "—"}</p>
              </div>
              <div className="panel-inner p-3">
                <p className="text-[11px] text-ink-400">Applied for</p>
                <p className="text-sm font-medium text-ink-800">{apps.length} job(s)</p>
              </div>
              <div className="panel-inner p-3">
                <p className="text-[11px] text-ink-400">Joined</p>
                <p className="text-sm font-medium text-ink-800">{new Date(candidate.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {candidate.skills?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {candidate.skills.map((s, i) => (
                  <span key={i} className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-500/20">{s}</span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 animate-fade-in-up">
            <div className="card-surface p-5">
              <h2 className="mb-3 text-sm font-semibold text-ink-900">Applications</h2>
              <div className="space-y-2.5">
                {apps.map((app) => (
                  <Link
                    key={app._id}
                    to={`/ats`}
                    className="panel-inner block p-3 transition-all duration-200 ease-smooth hover:border-brand-300 hover:bg-white hover:shadow-sm"
                  >
                    <p className="text-sm font-medium text-ink-800">{app.job?.title || "Job"}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[11px] text-ink-400">{new Date(app.createdAt).toLocaleDateString()}</span>
                      <span className="chip bg-brand-50 font-medium text-brand-700 ring-1 ring-brand-500/20">{app.status}</span>
                    </div>
                  </Link>
                ))}
                {apps.length === 0 && <p className="py-3 text-center text-xs text-ink-400">No applications yet</p>}
              </div>
            </div>

            <div className="card-surface p-5 lg:col-span-2">
              <h2 className="mb-3 text-sm font-semibold text-ink-900">Links</h2>
              <div className="space-y-2">
                {candidate.linkedin && (
                  <a
                    href={candidate.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl bg-surface-100 px-3.5 py-2.5 text-sm text-brand-600 ring-1 ring-ink-200/60 transition-all duration-200 ease-smooth hover:bg-white hover:ring-brand-300 hover:shadow-sm"
                  >
                    LinkedIn <span className="text-ink-400">↗</span>
                  </a>
                )}
                {candidate.portfolio && (
                  <a
                    href={candidate.portfolio}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl bg-surface-100 px-3.5 py-2.5 text-sm text-brand-600 ring-1 ring-ink-200/60 transition-all duration-200 ease-smooth hover:bg-white hover:ring-brand-300 hover:shadow-sm"
                  >
                    Portfolio <span className="text-ink-400">↗</span>
                  </a>
                )}
                {candidate.resume && (
                  <a
                    href={candidate.resume}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl bg-surface-100 px-3.5 py-2.5 text-sm text-brand-600 ring-1 ring-ink-200/60 transition-all duration-200 ease-smooth hover:bg-white hover:ring-brand-300 hover:shadow-sm"
                  >
                    Resume <span className="text-ink-400">↗</span>
                  </a>
                )}
                {!candidate.linkedin && !candidate.portfolio && !candidate.resume && (
                  <p className="py-3 text-center text-xs text-ink-400">No links provided</p>
                )}
              </div>

              {candidate.coverLetter && (
                <>
                  <h2 className="mb-2 mt-6 text-sm font-semibold text-ink-900">Cover Letter</h2>
                  <p className="rounded-xl bg-surface-100 p-4 text-sm leading-relaxed text-ink-600 ring-1 ring-ink-200/60">{candidate.coverLetter}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateDetail;
