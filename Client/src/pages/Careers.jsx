import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../utils/api";
import Searchicon from "../assets/iconamoon_search-thin.svg";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";

const typeOptions = ["Full-time", "Part-time", "Contract", "Internship", "Freelance", "Temporary"];
const experienceOptions = ["0-1 years", "1-2 years", "2-3 years", "3-4 years", "4-5 years", "5-6 years", "6-7 years", "7-8 years", "8-9 years", "9-10 years", "10+ years"];

const Careers = () => {
  const { slug } = useParams();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    location: "",
    experience: "",
    department: "",
  });

  const departments = [...new Set(jobs.map((j) => j.departmentName).filter(Boolean))];
  const locations = [...new Set(jobs.map((j) => j.location).filter(Boolean))];

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = { search: search || undefined };
      if (filters.category) params.category = filters.category;
      if (filters.location) params.location = filters.location;
      if (filters.experience) params.experience = filters.experience;
      if (filters.department) params.department = filters.department;
      const res = await api.get(`/job/public/${slug}`, { params });
      setJobs(res.data.data.jobs || []);
      setCompany(res.data.data.company);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const setFilter = (key) => (e) => {
    setFilters((p) => ({ ...p, [key]: e.target.value }));
    setTimeout(fetchJobs, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F2F6] via-[#F8F9FF] to-[#E8EAF6]">
      <header className="bg-gradient-to-br from-[#1A2340] via-[#131A2E] to-[#0B0F1C] text-white">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
              ← Home
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-xl font-bold flex-shrink-0 overflow-hidden">
              {company?.logo ? (
                <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
              ) : (
                company?.name?.[0] || "C"
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold font-montserrat">{company?.name || "Careers"}</h1>
              <p className="text-gray-400 text-sm mt-1">
                {jobs.length} open position{jobs.length === 1 ? "" : "s"} · Join our growing team
              </p>
            </div>
          </div>

          <div className="relative mt-8 max-w-xl">
            <img src={Searchicon} alt="" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-70" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchJobs()}
              placeholder="Search jobs by title, skill, or keyword..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/15 text-sm outline-none focus:border-[#4B6BFF] focus:ring-2 focus:ring-[#4B6BFF]/30 placeholder:text-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 max-w-xl">
            <select value={filters.category} onChange={setFilter("category")} className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm outline-none text-gray-200 focus:border-[#4B6BFF] [&>option]:text-gray-900">
              <option value="">All Types</option>
              {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filters.location} onChange={setFilter("location")} className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm outline-none text-gray-200 focus:border-[#4B6BFF] [&>option]:text-gray-900">
              <option value="">All Locations</option>
              {locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={filters.experience} onChange={setFilter("experience")} className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm outline-none text-gray-200 focus:border-[#4B6BFF] [&>option]:text-gray-900">
              <option value="">All Experience</option>
              {experienceOptions.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <select value={filters.department} onChange={setFilter("department")} className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm outline-none text-gray-200 focus:border-[#4B6BFF] [&>option]:text-gray-900">
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card border border-gray-100">
            <EmptyState
              title="No open positions"
              description="We couldn't find any jobs matching your criteria. Try adjusting your filters or check back later."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <Link
                key={job._id}
                to={`/careers/${slug}/${job._id}`}
                className="bg-white rounded-xl border border-gray-100 shadow-card p-5 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 flex flex-col"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-base font-semibold text-gray-900 leading-snug">{job.title}</h2>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">{job.location}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="bg-brand-50 text-brand-700 text-[10px] font-medium px-2 py-0.5 rounded-full">{job.employmentType}</span>
                    {job.departmentName && <span className="bg-gray-50 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded-full">{job.departmentName}</span>}
                    <span className="bg-gray-50 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded-full">Exp: {job.experience}</span>
                  </div>
                  {job.salary && <p className="text-xs text-gray-500 mb-2">{job.salary}</p>}
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-3">{job.description}</p>
                  {job.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.slice(0, 4).map((skill, idx) => (
                        <span key={idx} className="bg-gray-50 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">{job.openings || 1} opening(s)</span>
                  <span className="text-xs font-medium text-brand-600 hover:text-brand-700">View & Apply →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} {company?.name || "Careers"} · Powered by Employee Management
      </footer>
    </div>
  );
};

export default Careers;
