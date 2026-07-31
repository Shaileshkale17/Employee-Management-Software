import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import Skeleton from "../components/Skeleton";

const CareerJobDetail = () => {
  const { slug, jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/job/public/${slug}/${jobId}`);
        setJob(res.data.data.job);
        setCompany(res.data.data.company);
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [slug, jobId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-100 px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-card border border-gray-100 p-8">
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-4 w-1/3 mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-surface-100 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Job not found</h1>
        <p className="text-sm text-gray-400 mb-6">This position may be closed or no longer available.</p>
        <Link to={`/careers/${slug}`} className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
          Browse all jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F2F6] via-[#F8F9FF] to-[#E8EAF6]">
      <header className="bg-gradient-to-br from-[#1A2340] via-[#131A2E] to-[#0B0F1C] text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link to={`/careers/${slug}`} className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
            ← All open positions
          </Link>
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-[#4B6BFF]/20 text-[#8BA3FF] text-xs font-medium px-2.5 py-1 rounded-full">{job.employmentType}</span>
              <span className="bg-white/10 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">{job.departmentName || "General"}</span>
              <span className="bg-white/10 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">Exp: {job.experience}</span>
              {job.salary && <span className="bg-white/10 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">{job.salary}</span>}
            </div>
            <h1 className="text-3xl font-bold font-montserrat">{job.title}</h1>
            <p className="text-gray-400 text-sm mt-2">📍 {job.location} · {job.openings || 1} opening(s)</p>
            {company?.name && <p className="text-gray-500 text-xs mt-1">{company.name}</p>}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
          {job.description && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About the role</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
            </section>
          )}

          {job.responsibilities?.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Responsibilities</h2>
              <ul className="space-y-2">
                {job.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-brand-600 mt-0.5">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.qualifications?.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Qualifications</h2>
              <ul className="space-y-2">
                {job.qualifications.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-brand-600 mt-0.5">•</span>
                    {q}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.skills?.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s, i) => (
                  <span key={i} className="bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </section>
          )}

          {job.lastDate && (
            <p className="text-xs text-gray-400 mb-6">
              Applications close on {new Date(job.lastDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}

          <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
            <button
              onClick={() => navigate(`/careers/${slug}/${job._id}/apply`)}
              className="bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
            >
              Apply for this position
            </button>
            <Link to={`/careers/${slug}`} className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
              View more jobs
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CareerJobDetail;
