import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X, RefreshCw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import SideNavbar from "./SideNavber";
import HRSideNavber from "./HRSideNavber";
import EmployeeProfile from "./EmployeeProfile";
import EmployeeProfileModal from "./EmployeeProfileModal";
import EmptyState from "./EmptyState";
import { api } from "../utils/api";
import { debounce } from "../utils/debounce";
import { mapEmployeeSummary } from "../utils/employeeMappers";

const HR_ROLES = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"];

const SearchBarInAll = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("q") || "");
  const [department, setDepartment] = useState(searchParams.get("department") || "");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const debouncedSync = useRef(debounce(setDebouncedSearch, 300)).current;

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    setDebouncedSearch(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    debouncedSync(search);
    return () => debouncedSync.cancel();
  }, [search, debouncedSync]);

  useEffect(() => {
    const urlQ = searchParams.get("q") || "";
    const urlDept = searchParams.get("department") || "";
    const localQ = debouncedSearch.trim();
    const localDept = department.trim();
    if (localQ === urlQ && localDept === urlDept) return;
    const next = new URLSearchParams(searchParams);
    if (localQ) next.set("q", localQ);
    else next.delete("q");
    if (localDept) next.set("department", localDept);
    else next.delete("department");
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, department, searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/emp/emp-get", { params: { limit: 100 } });
        if (!cancelled) setData(response.data?.data?.data || []);
      } catch {
        if (!cancelled) setError("Unable to load employees. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const summaryCache = useRef(new Map());
  const getSummary = (raw) => {
    let summary = summaryCache.current.get(raw._id);
    if (!summary) {
      summary = mapEmployeeSummary(raw);
      summaryCache.current.set(raw._id, summary);
    }
    return summary;
  };

  const filteredData = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const dept = department.trim().toLowerCase();
    return data.filter((raw) => {
      const s = getSummary(raw);
      if (dept && !s.department.toLowerCase().includes(dept)) return false;
      if (!q) return true;
      return [s.name, s.employeeId, s.email, s.department, s.designation, s.role]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q));
    });
  }, [data, debouncedSearch, department]);

  const SideNav = (role) => {
    if (role === "developer" || role === "Employee" || role === "Interviewer") return <SideNavbar />;
    if (HR_ROLES.includes(role)) return <HRSideNavber />;
    return null;
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setDepartment("");
    setSearchParams({}, { replace: true });
  };

  const handleChat = (profile) => {
    if (!profile?.id) return;
    navigate(`/message?with=${profile.id}`);
  };

  const handleViewDepartment = (profile) => {
    if (!profile?.department) return;
    setSelected(null);
    navigate(`/search?department=${encodeURIComponent(profile.department)}`);
  };

  const hasActiveFilters = Boolean(debouncedSearch.trim() || department.trim());

  return (
    <div className="flex min-h-screen bg-surface-100">
      {user?.user?.role && SideNav(user.user.role)}
      <div className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-ink-950 sm:text-3xl">Search Employees</h1>
            <p className="mt-1 text-sm text-ink-500">
              Find employees across the organisation by name, employee ID, email, department, job title, or role.
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input
                type="text"
                placeholder="Search by name, ID, email, department, or title..."
                className="input-base pl-10 pr-10 shadow-card dark:bg-surface-200 dark:border-ink-700/40"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search employees"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {(department || (!loading && !error && filteredData.length > 0)) && (
              <div className="flex flex-wrap items-center gap-2">
                {department && (
                  <button
                    type="button"
                    onClick={() => setDepartment("")}
                    className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-500/20 transition-colors hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25">
                    <SlidersHorizontal className="h-3 w-3" />
                    Department: {department}
                    <X className="h-3 w-3" />
                  </button>
                )}
                {!loading && !error && (
                  <p className="text-xs text-ink-400">
                    {filteredData.length} {filteredData.length === 1 ? "result" : "results"}
                    {hasActiveFilters ? " for your filters" : ""}
                  </p>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card-surface p-4 dark:border-ink-700/40 dark:bg-surface-200">
                  <div className="flex items-center gap-3">
                    <div className="skeleton h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-3/4" />
                      <div className="skeleton h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="card-surface dark:border-ink-700/40 dark:bg-surface-200">
              <EmptyState
                icon={<Search className="h-8 w-8" />}
                title="Couldn't load employees"
                description={error}
                action={
                  <button type="button" className="btn-secondary btn-md" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4" />
                    Reload
                  </button>
                }
              />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="card-surface dark:border-ink-700/40 dark:bg-surface-200">
              <EmptyState
                icon={<Search className="h-8 w-8" />}
                title={hasActiveFilters ? "No employees match your search" : "No employees found"}
                description={
                  hasActiveFilters
                    ? "Try adjusting your search terms, clearing filters, or checking the spelling."
                    : "Employees will appear here once they are registered in the system."
                }
                action={
                  hasActiveFilters ? (
                    <button type="button" className="btn-secondary btn-md" onClick={clearFilters}>
                      Clear filters
                    </button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in-up">
              {filteredData.map((item) => (
                <EmployeeProfile key={item._id} item={item} onClick={() => setSelected(item)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <EmployeeProfileModal
        open={Boolean(selected)}
        employeeId={selected?._id}
        initialSummary={selected ? getSummary(selected) : null}
        onClose={() => setSelected(null)}
        onChat={handleChat}
        onViewDepartment={handleViewDepartment}
      />
    </div>
  );
};

export default SearchBarInAll;
