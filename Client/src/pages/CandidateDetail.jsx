import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { api } from "../utils/api";
import Button from "../components/Button";

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = user?.user?.role;
  const canManage = ["Company Admin", "HR", "HR Manager", "Recruiter"].includes(role);
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
      <div className="flex">
        {SideNav(role)}
        <div className="flex-1 min-h-screen p-6 bg-surface-100">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded-lg" />
            <div className="h-64 bg-gray-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex">
        {SideNav(role)}
        <div className="flex-1 min-h-screen p-6 bg-surface-100">
          <div className="text-center py-24 text-gray-400">Candidate not found</div>
        </div>
      </div>
    );
  }

  const apps = candidate.applications || [];

  return (
    <div className="flex">
      {SideNav(role)}
      <div className="flex-1 min-h-screen p-4 lg:p-6 bg-surface-100">
        <Link to="/ats" className="text-sm text-gray-500 hover:text-brand-600 font-medium transition-colors inline-block mb-4">
          ← Back to ATS
        </Link>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-lg">
                {candidate.firstName?.[0]}{candidate.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{candidate.firstName} {candidate.lastName}</h1>
                <p className="text-sm text-gray-500">{candidate.email}</p>
                {candidate.phone && <p className="text-xs text-gray-400">{candidate.phone}</p>}
              </div>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" label="Edit" onClick={() => navigate(`/candidates/${id}/edit`)} />
                <Button variant="danger" size="sm" label="Delete" onClick={handleDelete} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-surface-100 rounded-xl p-3">
              <p className="text-[11px] text-gray-400">Experience</p>
              <p className="text-sm font-medium text-gray-800">{candidate.experience || "—"}</p>
            </div>
            <div className="bg-surface-100 rounded-xl p-3">
              <p className="text-[11px] text-gray-400">Education</p>
              <p className="text-sm font-medium text-gray-800 truncate">{candidate.education || "—"}</p>
            </div>
            <div className="bg-surface-100 rounded-xl p-3">
              <p className="text-[11px] text-gray-400">Applied for</p>
              <p className="text-sm font-medium text-gray-800">{apps.length} job(s)</p>
            </div>
            <div className="bg-surface-100 rounded-xl p-3">
              <p className="text-[11px] text-gray-400">Joined</p>
              <p className="text-sm font-medium text-gray-800">{new Date(candidate.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {candidate.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-5">
              {candidate.skills.map((s, i) => (
                <span key={i} className="bg-brand-50 text-brand-700 text-[11px] px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Applications</h2>
            <div className="space-y-2.5">
              {apps.map((app) => (
                <Link key={app._id} to={`/ats`} className="block bg-surface-100 rounded-xl p-3 hover:bg-surface-200 transition-colors">
                  <p className="text-sm font-medium text-gray-800">{app.job?.title || "Job"}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] text-gray-400">{new Date(app.createdAt).toLocaleDateString()}</span>
                    <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">{app.status}</span>
                  </div>
                </Link>
              ))}
              {apps.length === 0 && <p className="text-xs text-gray-400 py-3 text-center">No applications yet</p>}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Links</h2>
            <div className="space-y-2">
              {candidate.linkedin && (
                <a href={candidate.linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-surface-100 rounded-xl px-3.5 py-2.5 text-sm text-brand-600 hover:bg-surface-200 transition-colors">
                  LinkedIn <span className="text-gray-400">↗</span>
                </a>
              )}
              {candidate.portfolio && (
                <a href={candidate.portfolio} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-surface-100 rounded-xl px-3.5 py-2.5 text-sm text-brand-600 hover:bg-surface-200 transition-colors">
                  Portfolio <span className="text-gray-400">↗</span>
                </a>
              )}
              {candidate.resume && (
                <a href={candidate.resume} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-surface-100 rounded-xl px-3.5 py-2.5 text-sm text-brand-600 hover:bg-surface-200 transition-colors">
                  Resume <span className="text-gray-400">↗</span>
                </a>
              )}
              {!candidate.linkedin && !candidate.portfolio && !candidate.resume && (
                <p className="text-xs text-gray-400 py-3 text-center">No links provided</p>
              )}
            </div>

            {candidate.coverLetter && (
              <>
                <h2 className="text-sm font-semibold text-gray-900 mt-6 mb-2">Cover Letter</h2>
                <p className="text-sm text-gray-600 leading-relaxed bg-surface-100 rounded-xl p-4">{candidate.coverLetter}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;
