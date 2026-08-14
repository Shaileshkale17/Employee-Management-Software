import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import { MapPin, CircleX } from "lucide-react";

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
      <div className="min-h-screen bg-mesh-light px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="card-surface p-8">
            <Skeleton className="h-8 w-2/3 mb-4" />
            <Skeleton className="h-4 w-1/3 mb-6" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-mesh-light flex items-center justify-center px-4">
        <div className="card-surface shadow-popover p-10 max-w-md w-full text-center animate-scale-in">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-ink-100 text-ink-400 flex items-center justify-center mb-5">
            <CircleX className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-ink-950 mb-2">Job not found</h1>
          <p className="text-sm text-ink-400 mb-6">This position may be closed or no longer available.</p>
          <Link to={`/careers/${slug}`} className="btn-primary btn-md inline-flex items-center justify-center w-full">
            Browse all jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh-light">
      <header className="bg-surface-900 bg-mesh-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <Link to={`/careers/${slug}`} className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors focus-ring rounded-lg">
            <span aria-hidden="true">←</span> All open positions
          </Link>
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="chip bg-brand-400/15 text-brand-300">{job.employmentType}</span>
              <span className="chip bg-white/10 text-white/70">{job.departmentName || "General"}</span>
              <span className="chip bg-white/10 text-white/70">Exp: {job.experience}</span>
              {job.salary && <span className="chip bg-white/10 text-white/70">{job.salary}</span>}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">{job.title}</h1>
            <p className="text-white/60 text-sm mt-2 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {job.location} · {job.openings || 1} opening(s)
            </p>
            {company?.name && <p className="text-white/40 text-xs mt-1.5">{company.name}</p>}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="card-surface p-6 sm:p-8">
          {job.description && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-ink-900 mb-3">About the role</h2>
              <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-line">{job.description}</p>
            </section>
          )}

          {job.responsibilities?.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-ink-900 mb-3">Responsibilities</h2>
              <ul className="space-y-2.5">
                {job.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-ink-600 leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500 flex-shrink-0" aria-hidden="true" />
                    {r}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.qualifications?.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-ink-900 mb-3">Qualifications</h2>
              <ul className="space-y-2.5">
                {job.qualifications.map((q, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-ink-600 leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500 flex-shrink-0" aria-hidden="true" />
                    {q}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.skills?.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-ink-900 mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s, i) => (
                  <span key={i} className="chip bg-brand-50 text-brand-700">{s}</span>
                ))}
              </div>
            </section>
          )}

          {job.lastDate && (
            <p className="text-xs text-ink-400 mb-6">
              Applications close on {new Date(job.lastDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}

          <div className="flex items-center gap-3 pt-6 border-t border-ink-100">
            <Button
              label="Apply for this position"
              size="lg"
              onClick={() => navigate(`/careers/${slug}/${job._id}/apply`)}
            />
            <Link to={`/careers/${slug}`} className="text-sm text-ink-500 hover:text-ink-700 font-medium transition-colors focus-ring rounded-lg">
              View more jobs
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CareerJobDetail;
