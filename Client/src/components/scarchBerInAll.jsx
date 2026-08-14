import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import SideNavbar from "./SideNavber";
import logo from "../assets/ChatGPT Image Apr 7, 2025, 12_02_12 PM (1).svg";
import EmployeeProfile from "./EmployeeProfile";
import { useSelector } from "react-redux";
import HRSideNavber from "./HRSideNavber";
import { api } from "../utils/api";
import EmptyState from "./EmptyState";

const SearchBarInAll = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/emp/emp-get");
        setData(response.data?.data?.data || []);
      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const SideNav = (role) => {
    if (role === "developer" || role === "Employee" || role === "Interviewer") return <SideNavbar />;
    if (["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(role)) return <HRSideNavber />;
    return null;
  };

  const filteredData = data.filter((item) =>
    [item?.name, item?.email, item?.phone, item?.role].some((field) =>
      field?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="flex min-h-screen bg-surface-100">
      {user?.user?.role && SideNav(user.user.role)}
      <div className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-ink-950 sm:text-3xl">Search Employees</h1>
            <p className="mt-1 text-sm text-ink-500">
              Find employees across the organisation by name, email, phone, or role.
            </p>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or role..."
              className="input-base pl-10 shadow-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search employees"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card-surface p-4">
                  <div className="skeleton h-36 w-full rounded-lg mb-3" />
                  <div className="skeleton h-4 w-3/4 mb-2" />
                  <div className="skeleton h-3 w-1/2 mb-1" />
                  <div className="skeleton h-3 w-2/3 mb-1" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="card-surface">
              <EmptyState
                icon={<Search className="w-8 h-8" />}
                title={search ? "No employees match your search" : "No employees found"}
                description={
                  search
                    ? "Try adjusting your search terms or checking the spelling."
                    : "Employees will appear here once they are registered in the system."
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredData.map((item, index) => (
                <EmployeeProfile
                  key={item._id || index}
                  index={index}
                  image={item.image || logo}
                  email={item.email?.length >= 17 ? item.email.slice(0, 17) + "..." : item.email}
                  name={item.name?.length >= 13 ? item.name.slice(0, 13) + "..." : item.name}
                  phone={item.phone}
                  role={item.role}
                  status={item.status}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBarInAll;
