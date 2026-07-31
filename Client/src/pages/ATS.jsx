import { useEffect, useMemo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { api } from "../utils/api";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";
import Searchicon from "../assets/iconamoon_search-thin.svg";

const PIPELINE = [
  {
    key: "Applied",
    label: "New Applications",
    color: "bg-blue-50 text-blue-700 border-blue-100",
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

const ATS = () => {
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
    <div className="flex">
      {SideNav(user?.user?.role)}
      <div className="flex-1 min-h-screen p-4 lg:p-6 bg-surface-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Applicant Tracking
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage candidates through the hiring pipeline
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <img
                src={Searchicon}
                alt=""
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
              />
              <input
                type="text"
                placeholder="Search candidates..."
                className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 w-full sm:w-56"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
          <div className="bg-white rounded-2xl shadow-card border border-gray-100">
            <EmptyState
              title="No applications yet"
              description="Applications from your career portal will appear here as soon as candidates apply."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {PIPELINE.map((col) => {
              const items = byStatus[col.key] || [];
              return (
                <div
                  key={col.key}
                  className="bg-surface-200/60 rounded-xl p-3 min-h-[200px]"
                >
                  <div className="flex items-center justify-between px-1 mb-3">
                    <div
                      className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border ${col.color}`}
                    >
                      <span className="text-xs font-semibold">{col.label}</span>
                      <span className="text-[10px] font-bold">
                        {items.length}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <div className="text-center text-[11px] text-gray-400 py-4 border border-dashed border-gray-200 rounded-lg">
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
                          className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-card p-3.5 hover:shadow-card-hover transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-xs flex-shrink-0">
                              {app.candidate?.firstName?.[0]}
                              {app.candidate?.lastName?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {app.candidate?.firstName}{" "}
                                {app.candidate?.lastName}
                              </h3>
                              <p className="text-[11px] text-gray-500 truncate">
                                {app.job?.title}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {app.candidate?.skills
                                  ?.slice(0, 3)
                                  .map((s, i) => (
                                    <span
                                      key={i}
                                      className="bg-gray-50 text-gray-400 text-[9px] px-1.5 py-0.5 rounded"
                                    >
                                      {s}
                                    </span>
                                  ))}
                              </div>
                              <p className="text-[10px] text-gray-300 mt-1.5">
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-modal w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-base">
                      {selected.candidate?.firstName?.[0]}
                      {selected.candidate?.lastName?.[0]}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selected.candidate?.firstName}{" "}
                        {selected.candidate?.lastName}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {selected.candidate?.email}
                      </p>
                      {selected.candidate?.phone && (
                        <p className="text-xs text-gray-400">
                          {selected.candidate.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span className="text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full">
                    {selected.job?.title}
                  </span>
                  {selected.candidate?.experience && (
                    <span className="text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full">
                      Exp: {selected.candidate.experience}
                    </span>
                  )}
                  {selected.candidate?.education && (
                    <span className="text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full">
                      {selected.candidate.education}
                    </span>
                  )}
                  <span className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium">
                    {selected.status}
                  </span>
                </div>

                {selected.candidate?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {selected.candidate.skills.map((s, i) => (
                      <span
                        key={i}
                        className="bg-brand-50 text-brand-700 text-[11px] px-2 py-0.5 rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 mb-6">
                  <button
                    onClick={() =>
                      navigate(`/candidates/${selected.candidate?._id}`)
                    }
                    className="bg-brand-600 text-white px-3.5 py-2 rounded-lg text-xs font-medium hover:bg-brand-700 transition-colors"
                  >
                    View Full Profile
                  </button>
                  {selected.candidate?.resume && (
                    <a
                      href={selected.candidate.resume}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-white text-gray-600 px-3.5 py-2 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      View Resume
                    </a>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Move to stage
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PIPELINE.filter((p) => p.key !== selected.status).map(
                      (p) => (
                        <button
                          key={p.key}
                          onClick={() => handleStatusChange(selected, p.key)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${p.color} hover:opacity-80`}
                        >
                          {p.label}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <form onSubmit={handleAddNote} className="mb-6">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Add note
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Add an internal note..."
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                    <button
                      type="submit"
                      className="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-brand-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </form>

                <div>
                  <h3 className="text-xs font-semibold text-gray-700 mb-3">
                    Candidate Timeline
                  </h3>
                  <div className="space-y-0">
                    {(selected.timeline?.length ? selected.timeline : []).map(
                      (t, i, arr) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-2.5 h-2.5 rounded-full mt-1 ${i === arr.length - 1 ? "bg-brand-500" : "bg-gray-300"}`}
                            />
                            {i < arr.length - 1 && (
                              <div className="w-px flex-1 bg-gray-200" />
                            )}
                          </div>
                          <div className="pb-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-800">
                                {t.status}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {t.by?.name ? `${t.by.name} · ` : ""}
                                {new Date(t.at).toLocaleString()}
                              </span>
                            </div>
                            {t.note && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {t.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                    {!selected.timeline?.length && (
                      <p className="text-xs text-gray-400">
                        No timeline entries yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ATS;
