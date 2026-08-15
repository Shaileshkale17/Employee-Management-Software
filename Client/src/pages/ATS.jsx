import { useEffect, useMemo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { api } from "../utils/api";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";
import { Search, X } from "lucide-react";

const PIPELINE = [
  {
    key: "Applied",
    label: "New Applications",
    color: "bg-purple-50 text-purple-700 border-purple-100",
  },
  {
    key: "Screening",
    label: "Under Review",
    color: "bg-yellow-50 text-yellow-700 border-yellow-100",
  },
  {
    key: "Shortlisted",
    label: "Shortlisted",
    color: "bg-purple-50 text-purple-700 border-purple-100",
  },
  {
    key: "Interview",
    label: "Interview Scheduled",
    color: "bg-indigo-50 text-indigo-700 border-indigo-100",
  },
  {
    key: "Offer",
    label: "Selected",
    color: "bg-green-50 text-green-700 border-green-100",
  },
  {
    key: "Hired",
    label: "Hired",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    key: "Rejected",
    label: "Rejected",
    color: "bg-red-50 text-red-600 border-red-100",
  },
];

const sortOptions = [
  { label: "Newest first", value: "-createdAt" },
  { label: "Oldest first", value: "createdAt" },
];

const selectChevron = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a94a6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
};

const ApplicantTracking = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [selected, setSelected] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");

  const SideNav = (role) => {
    if (role === "developer" || role === "Employee" || role === "Interviewer")
      return <SideNavbar />;
    if (
      role === "Super Admin" ||
      role === "Company Admin" ||
      role === "HR" ||
      role === "HR Manager" ||
      role === "Recruiter"
    )
      return <HRSideNavber />;
    return null;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (jobFilter) params.job = jobFilter;
      if (sort) {
        const [field, order] = sort.startsWith("-")
          ? [sort.slice(1), "desc"]
          : [sort, "asc"];
        params.sort = field;
        params.order = order;
      }
      const [appRes, jobRes] = await Promise.all([
        api.get("/application/all", { params }),
        api.get("/job/all", { params: { limit: 100 } }),
      ]);
      console.log({ appRes });
      setApplications(appRes.data.data.data || []);
      setJobs(jobRes.data.data?.data || []);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [search, jobFilter, sort]);

  useEffect(() => {
    const t = setTimeout(fetchData, 250);
    return () => clearTimeout(t);
  }, [fetchData]);

  const byStatus = useMemo(() => {
    const map = {};
    PIPELINE.forEach((p) => (map[p.key] = []));
    applications.forEach((app) => {
      const key = map[app.status] ? app.status : "Applied";
      map[key]?.push(app);
    });
    return map;
  }, [applications]);

  const handleStatusChange = async (app, status) => {
    try {
      await api.put(`/application/update-status/${app._id}`, { status });
      toast.success(`Moved to ${status}`);
      setSelected(null);
      fetchData();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteDraft.trim() || !selected) return;
    try {
      await api.post(`/application/${selected._id}/notes`, { note: noteDraft });
      toast.success("Note added");
      setNoteDraft("");
      const res = await api.get(`/application/show/${selected._id}`);
      setSelected(res.data.data);
      fetchData();
    } catch {
      toast.error("Failed to add note");
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(user?.user?.role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 animate-fade-in-down lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
                Applicant Tracking
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                Manage candidates through the hiring pipeline
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  aria-label="Search candidates"
                  className="input-base pl-10 pr-4 sm:w-56"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                aria-label="Filter by job"
                className="input-base appearance-none cursor-pointer pr-10 sm:w-auto"
                style={selectChevron}
              >
                <option value="">All jobs</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.title}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort applications"
                className="input-base appearance-none cursor-pointer pr-10 sm:w-auto"
                style={selectChevron}
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <SkeletonList rows={4} />
          ) : applications.length === 0 ? (
            <div className="card-surface animate-fade-in">
              <EmptyState
                title="No applications yet"
                description="Applications from your career portal will appear here as soon as candidates apply."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 animate-fade-in-up">
              {PIPELINE.map((col) => {
                const items = byStatus[col.key] || [];
                return (
                  <div
                    key={col.key}
                    className="min-h-[200px] rounded-2xl border border-ink-200/60 bg-surface-100/60 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between px-1">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${col.color}`}
                      >
                        <span className="text-xs font-semibold">
                          {col.label}
                        </span>
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white/70 px-1 text-[10px] font-bold">
                          {items.length}
                        </span>
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-ink-200 py-4 text-center text-[11px] text-ink-400">
                          No candidates
                        </div>
                      ) : (
                        items.map((app) => (
                          <button
                            key={app._id}
                            onClick={() => {
                              setSelected(app);
                              setNoteDraft("");
                            }}
                            className="card-surface card-hover w-full p-4 text-left"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
                                {app.candidate?.firstName?.[0]}
                                {app.candidate?.lastName?.[0]}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="truncate text-sm font-medium text-ink-900">
                                  {app.candidate?.firstName}{" "}
                                  {app.candidate?.lastName}
                                </h3>
                                <p className="truncate text-[11px] text-ink-500">
                                  {app.job?.title}
                                </p>
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {app.candidate?.skills
                                    ?.slice(0, 3)
                                    .map((s, i) => (
                                      <span
                                        key={i}
                                        className="rounded-md bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-ink-600 ring-1 ring-ink-200/60"
                                      >
                                        {s}
                                      </span>
                                    ))}
                                </div>
                                <p className="mt-1.5 text-[10px] text-ink-300">
                                  Applied{" "}
                                  {new Date(
                                    app.appliedDate || app.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selected && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            >
              <div
                className="card-surface max-h-[90vh] w-full max-w-2xl overflow-y-auto scrollbar-thin p-6 shadow-modal animate-scale-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-base font-semibold text-white">
                      {selected.candidate?.firstName?.[0]}
                      {selected.candidate?.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-ink-950">
                        {selected.candidate?.firstName}{" "}
                        {selected.candidate?.lastName}
                      </h2>
                      <p className="break-words text-sm text-ink-500">
                        {selected.candidate?.email}
                      </p>
                      {selected.candidate?.phone && (
                        <p className="text-xs text-ink-400">
                          {selected.candidate.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    aria-label="Close details"
                    className="focus-ring flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors duration-200 hover:bg-surface-100 hover:text-ink-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="chip bg-surface-100 text-ink-600 ring-1 ring-ink-200/60">
                    {selected.job?.title}
                  </span>
                  {selected.candidate?.experience && (
                    <span className="chip bg-surface-100 text-ink-600 ring-1 ring-ink-200/60">
                      Exp: {selected.candidate.experience}
                    </span>
                  )}
                  {selected.candidate?.education && (
                    <span className="chip bg-surface-100 text-ink-600 ring-1 ring-ink-200/60">
                      {selected.candidate.education}
                    </span>
                  )}
                  <span className="chip bg-brand-50 font-semibold text-brand-700 ring-1 ring-brand-500/20">
                    {selected.status}
                  </span>
                </div>

                {selected.candidate?.skills?.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-1.5">
                    {selected.candidate.skills.map((s, i) => (
                      <span
                        key={i}
                        className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-500/20"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mb-6 flex flex-wrap gap-1.5">
                  <button
                    onClick={() =>
                      navigate(`/candidates/${selected.candidate?._id}`)
                    }
                    className="btn-primary btn-sm"
                  >
                    View Full Profile
                  </button>
                  {selected.candidate?.resume && (
                    <a
                      href={selected.candidate.resume}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary btn-sm"
                    >
                      View Resume
                    </a>
                  )}
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-xs font-semibold text-ink-700">
                    Move to stage
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PIPELINE.filter((p) => p.key !== selected.status).map(
                      (p) => (
                        <button
                          key={p.key}
                          onClick={() => handleStatusChange(selected, p.key)}
                          className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${p.color}`}
                        >
                          {p.label}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <form onSubmit={handleAddNote} className="mb-6">
                  <label htmlFor="ats-note" className="mb-2 block text-xs font-semibold text-ink-700">
                    Add note
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="ats-note"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Add an internal note..."
                      className="input-base flex-1"
                    />
                    <button type="submit" className="btn-primary btn-md">
                      Add
                    </button>
                  </div>
                </form>

                <div>
                  <h3 className="mb-3 text-xs font-semibold text-ink-700">
                    Candidate Timeline
                  </h3>
                  <div className="space-y-0">
                    {(selected.timeline?.length ? selected.timeline : []).map(
                      (t, i, arr) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`mt-1 h-2.5 w-2.5 rounded-full ${i === arr.length - 1 ? "bg-brand-500" : "bg-ink-200"}`}
                            />
                            {i < arr.length - 1 && (
                              <div className="w-px flex-1 bg-ink-100" />
                            )}
                          </div>
                          <div className="pb-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-ink-800">
                                {t.status}
                              </span>
                              <span className="text-[10px] text-ink-400">
                                {t.by?.name ? `${t.by.name} · ` : ""}
                                {new Date(t.at).toLocaleString()}
                              </span>
                            </div>
                            {t.note && (
                              <p className="mt-0.5 text-xs text-ink-500">
                                {t.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                    {!selected.timeline?.length && (
                      <p className="text-xs text-ink-400">
                        No timeline entries yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ApplicantTracking;
