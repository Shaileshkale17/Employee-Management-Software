import { useEffect, useState } from "react";
import SideNavbar from "./SideNavber";
import logo from "../assets/ChatGPT Image Apr 7, 2025, 12_02_12 PM (1).svg";
import Searchicon from "../assets/iconamoon_search-thin.svg";
import EmployeeProfile from "./EmployeeProfile";
import { useSelector } from "react-redux";
import HRSideNavber from "./HRSideNavber";
import { api } from "../utils/api";

const SearchBarInAll = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

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
    switch (role) {
      case "developer": return <SideNavbar />;
      case "HR Manager": return <HRSideNavber />;
      default: return null;
    }
  };

  const filteredData = data.filter((item) =>
    [item?.name, item?.email, item?.phone, item?.role].some((field) =>
      field?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="flex">
      {user?.user?.role && SideNav(user.user.role)}
      <div className="flex-1 min-h-screen p-6 bg-surface-100">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Search Employees</h1>
        <div className="relative max-w-md mb-6">
          <img src={Searchicon} alt="" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or role..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="skeleton h-36 w-full rounded-lg mb-3" />
                <div className="skeleton h-4 w-3/4 mb-2" />
                <div className="skeleton h-3 w-1/2 mb-1" />
                <div className="skeleton h-3 w-2/3 mb-1" />
                <div className="skeleton h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-sm">
            {search ? "No employees match your search" : "No employees found"}
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
  );
};

export default SearchBarInAll;
