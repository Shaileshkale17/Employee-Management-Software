import { useEffect, useState } from "react";
import SideNavbar from "../components/SideNavber";
import arrowRight from "../assets/material-symbols-light_arrow-back-rounded-1.svg";
import arrowLeft from "../assets/material-symbols-light_arrow-back-rounded.svg";
import EventCard from "../components/EventCard";
import { useSelector } from "react-redux";
import HRSideNavber from "../components/HRSideNavber";
import { api } from "../utils/api";

const Event = () => {
  const [taskinfo, setTaskinfo] = useState([]);
  const [clickShow, setClickShow] = useState(true);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  const SideNav = (role) => {
    switch (role) {
      case "developer":
        return <SideNavbar />;
      case "HR Manager":
        return <HRSideNavber />;
      default:
        return null;
    }
  };

  const getAPi = async () => {
    setLoading(true);
    try {
      const res = await api.get("/event/event-all");
      setTaskinfo(res.data.data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAPi();
  }, []);

  const uniqueTaskTitles = [...new Set(taskinfo.map((item) => item.taskTitle))];
  const filteredTasks = selectedTaskTitle
    ? taskinfo.filter((task) => task.taskTitle === selectedTaskTitle)
    : taskinfo;

  return (
    <div className="flex">
      {SideNav(user?.user?.role)}
      <div className="flex-1 flex h-[calc(100vh-4rem)]">
        <div
          className={`relative bg-white border-r border-gray-200 transition-all duration-300 ${
            clickShow ? "w-72" : "w-0 overflow-hidden"
          }`}>
          <div className="p-4 min-h-full overflow-y-auto scrollbar-thin">
            <button
              onClick={() => setClickShow(false)}
              className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Collapse sidebar">
              <img src={arrowLeft} alt="" className="w-5 h-5" />
            </button>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-10 mb-3">Event Types</h3>
            <ul className="space-y-1">
              {uniqueTaskTitles.map((title, index) => (
                <li key={index}>
                  <button
                    onClick={() => setSelectedTaskTitle(title)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedTaskTitle === title
                        ? "bg-brand-600 text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}>
                    {title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {!clickShow && (
          <button
            onClick={() => setClickShow(true)}
            className="p-2 bg-white border-r border-gray-200 hover:bg-gray-50 transition-colors self-start mt-4 rounded-r-lg"
            aria-label="Expand sidebar">
            <img src={arrowRight} alt="" className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 p-6 overflow-y-auto bg-surface-100">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
                  <div className="skeleton h-5 w-3/4 mb-3" />
                  <div className="skeleton h-4 w-full mb-2" />
                  <div className="skeleton h-4 w-2/3 mb-2" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No events found
            </div>
          ) : (
            <EventCard tasks={filteredTasks} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Event;
