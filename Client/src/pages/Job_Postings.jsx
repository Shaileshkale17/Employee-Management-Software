import { useState, useEffect, useCallback } from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Searchicon from "../assets/iconamoon_search-thin.svg";
import JobPostCart from "../components/Job_post_cart";
import { api } from "../utils/api";
import { SkeletonList } from "../components/Skeleton";

const Job_Postings = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const role = user?.user?.role;
  const canManage = ["Company Admin", "HR", "HR Manager", "Recruiter"].includes(role);

  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [companySlug, setCompanySlug] = useState("");

  const SideNav = (r) => {
    if (r === "developer") return <SideNavbar />;
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
    <div className="flex">
      {SideNav(role)}
      <div className="flex-1 min-h-screen p-6 bg-surface-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-xl font-bold text-gray-900">Job Postings</h1>
          {canManage && (
            <Link to="/Job-post-form">
              <button className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20">
                + Post Job
              </button>
            </Link>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative max-w-md flex-1">
            <img src={Searchicon} alt="" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" />
            <input
              type="text"
              placeholder="Search job postings..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:border-brand-300 hover:text-brand-600 transition-colors"
              title="Public careers page"
            >
              View careers page
            </button>
          )}
        </div>

        {loading ? (
          <SkeletonList rows={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredJobs.map((item) => (
              <div key={item._id} className="relative group">
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
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-col">
                    <div className="flex gap-1">
                      <button onClick={() => navigate(`/Job-post-form/${item._id}`)} className="bg-white/90 backdrop-blur-sm text-gray-600 hover:text-brand-600 p-1.5 rounded-lg shadow-sm border border-gray-200 text-xs">
                        Edit
                      </button>
                      <button onClick={() => handleDuplicate(item._id)} className="bg-white/90 backdrop-blur-sm text-gray-600 hover:text-brand-600 p-1.5 rounded-lg shadow-sm border border-gray-200 text-xs" title="Duplicate as draft">
                        Copy
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-600 p-1.5 rounded-lg shadow-sm border border-gray-200 text-xs">
                        Del
                      </button>
                    </div>
                    <div className="flex gap-1 mt-1 justify-end">
                      {item.status === "Active" && (
                        <button onClick={() => handleClose(item._id)} className="bg-white/90 backdrop-blur-sm text-gray-600 hover:text-amber-600 p-1.5 rounded-lg shadow-sm border border-gray-200 text-xs" title="Close job">
                          Close
                        </button>
                      )}
                      {(item.status === "Active" || item.status === "Closed") && (
                        <button onClick={() => handleArchive(item._id)} className="bg-white/90 backdrop-blur-sm text-gray-600 hover:text-gray-900 p-1.5 rounded-lg shadow-sm border border-gray-200 text-xs" title="Archive job">
                          Archive
                        </button>
                      )}
                      {item.status !== "Active" && (
                        <button onClick={() => handleReopen(item._id)} className="bg-white/90 backdrop-blur-sm text-gray-600 hover:text-green-600 p-1.5 rounded-lg shadow-sm border border-gray-200 text-xs" title="Reactivate job">
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
          <div className="text-center text-gray-400 py-20 text-sm">No job postings match your filters</div>
        )}
      </div>
    </div>
  );
};

export default Job_Postings;
