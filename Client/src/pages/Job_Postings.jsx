import { useState, useEffect, useCallback } from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Search } from "lucide-react";
import JobPostCart from "../components/Job_post_cart";
import { api } from "../utils/api";
import { SkeletonList } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

const selectChevron = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a94a6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
};

const actionBtn =
  "inline-flex items-center rounded-lg border border-ink-200/60 bg-white/90 px-2 py-1 text-[11px] font-medium text-ink-600 shadow-sm backdrop-blur-sm transition-colors duration-200 focus-ring hover:border-ink-300 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 dark:border-ink-700/40 dark:hover:border-ink-700/60";

const Job_Postings = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const role = user?.user?.role;
  const canManage = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(role);

  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [companySlug, setCompanySlug] = useState("");

  const SideNav = (r) => {
    if (r === "developer" || r === "Employee" || r === "Interviewer") return <SideNavbar />;
    if (canManage) return <HRSideNavber />;
    return null;
  };

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/job/all", { params });
      setJobs(res.data.data?.data || []);
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    api.get("/company/profile")
      .then((res) => setCompanySlug(res.data.data.slug || ""))
      .catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job posting?")) return;
    try {
      await api.delete(`/job/delete/${id}`);
      toast.success("Job deleted");
      fetchJobs();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/job/duplicate/${id}`);
      toast.success("Job duplicated as draft");
      fetchJobs();
    } catch {
      toast.error("Failed to duplicate job");
    }
  };

  const handleClose = async (id) => {
    try {
      await api.put(`/job/close/${id}`);
      toast.success("Job closed");
      fetchJobs();
    } catch {
      toast.error("Failed to close job");
    }
  };

  const handleArchive = async (id) => {
    try {
      await api.put(`/job/archive/${id}`);
      toast.success("Job archived");
      fetchJobs();
    } catch {
      toast.error("Failed to archive job");
    }
  };

  const handleReopen = async (id) => {
    try {
      await api.put(`/job/reopen/${id}`);
      toast.success("Job reactivated");
      fetchJobs();
    } catch {
      toast.error("Failed to reactivate job");
    }
  };

  const filteredJobs = jobs.filter((item) =>
    [item.title, item.description, item.location, item.salary, item.employmentType, item.type, item.experience]
      .some((f) => f?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-down">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
                Job Postings
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                Create and manage openings across your organisation
              </p>
            </div>
            {canManage && (
              <Link to="/Job-post-form">
                <button className="btn-primary btn-lg w-full sm:w-auto">
                  + Post Job
                </button>
              </Link>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-in">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search job postings..."
                aria-label="Search job postings"
                className="input-base pl-10 pr-4"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="input-base appearance-none cursor-pointer pr-10 sm:w-auto"
              style={selectChevron}
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
              <option value="Archived">Archived</option>
            </select>
            {canManage && (
              <button
                onClick={() => navigate(`/careers/${companySlug || "techcorp"}`)}
                title="Public careers page"
                className="btn-secondary btn-md w-full sm:w-auto"
              >
                View careers page
              </button>
            )}
          </div>

          {loading ? (
            <SkeletonList rows={4} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 animate-fade-in-up">
              {filteredJobs.map((item) => (
                <div key={item._id} className="group relative">
                  <JobPostCart
                    jobTitle={item.title}
                    jobDescription={item.description}
                    location={item.location}
                    skills={item.skills}
                    jobType={item.employmentType || item.type}
                    experience={item.experience}
                    salary={item.salary}
                    applicantsCount={item.applicantsCount}
                    status={item.status}
                  />
                  {canManage && (
                    <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1 opacity-100 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100">
                      <div className="flex gap-1">
                        <button
                          onClick={() => navigate(`/Job-post-form/${item._id}`)}
                          aria-label={`Edit ${item.title}`}
                          className={actionBtn}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(item._id)}
                          title="Duplicate as draft"
                          aria-label={`Duplicate ${item.title} as draft`}
                          className={actionBtn}
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          aria-label={`Delete ${item.title}`}
                          className={`${actionBtn} hover:border-red-300 hover:text-red-600`}
                        >
                          Del
                        </button>
                      </div>
                      <div className="mt-1 flex justify-end gap-1">
                        {item.status === "Active" && (
                          <button
                            onClick={() => handleClose(item._id)}
                            title="Close job"
                            aria-label={`Close ${item.title}`}
                            className={`${actionBtn} hover:border-amber-300 hover:text-amber-600`}
                          >
                            Close
                          </button>
                        )}
                        {(item.status === "Active" || item.status === "Closed") && (
                          <button
                            onClick={() => handleArchive(item._id)}
                            title="Archive job"
                            aria-label={`Archive ${item.title}`}
                            className={`${actionBtn} hover:border-ink-400 hover:text-ink-900`}
                          >
                            Archive
                          </button>
                        )}
                        {item.status !== "Active" && (
                          <button
                            onClick={() => handleReopen(item._id)}
                            title="Reactivate job"
                            aria-label={`Reopen ${item.title}`}
                            className={`${actionBtn} hover:border-emerald-300 hover:text-emerald-600`}
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && filteredJobs.length === 0 && (
            <div className="card-surface animate-fade-in">
              <EmptyState
                title="No job postings found"
                description="No job postings match your filters. Try adjusting your search or filter criteria."
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Job_Postings;
