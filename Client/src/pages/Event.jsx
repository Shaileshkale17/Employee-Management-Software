import { useEffect, useState } from "react";
import SideNavbar from "../components/SideNavber";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import EventCard from "../components/EventCard";
import EmptyState from "../components/EmptyState";
import { useSelector } from "react-redux";
import HRSideNavber from "../components/HRSideNavber";
import { api } from "../utils/api";

const Event = () => {
  const [taskinfo, setTaskinfo] = useState([]);
  const [clickShow, setClickShow] = useState(true);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  const SideNav = (role) =>
    ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(role)
      ? <HRSideNavber />
      : <SideNavbar />;

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
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(user?.user?.role)}
      <main className="flex-1 flex h-[100vh] h-[calc(100dvh-4rem)] bg-mesh-light">
        {clickShow && (
          <div
            className="fixed inset-0 z-30 bg-ink-950/50 backdrop-blur-sm md:hidden"
            onClick={() => setClickShow(false)}
            aria-hidden="true"
          />
        )}
        <div
          className={`fixed inset-y-0 left-0 z-40 w-72 bg-white/80 backdrop-blur-sm border-r border-ink-200/60 transition-all duration-300 md:static dark:bg-white/5 dark:border-ink-700/40 ${
            clickShow ? "translate-x-0 md:w-72" : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden"
          }`}>
          <div className="p-4 min-h-full overflow-y-auto scrollbar-thin">
            <button
              onClick={() => setClickShow(false)}
              className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-ink-100/70 transition-colors focus-ring"
              aria-label="Collapse sidebar">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mt-10 mb-3">Event Types</h3>
            <ul className="space-y-1">
              {uniqueTaskTitles.map((title, index) => (
                <li key={index}>
                  <button
                    onClick={() => setSelectedTaskTitle(title)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus-ring ${
                      selectedTaskTitle === title
                        ? "bg-brand-600 text-white shadow-md shadow-brand-600/20"
                        : "text-ink-600 hover:text-ink-950 hover:bg-ink-50"
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
            className="p-2 bg-white/80 border-r border-ink-200/60 hover:bg-white transition-colors self-start mt-4 rounded-r-lg shadow-sm focus-ring dark:bg-white/5 dark:hover:bg-white/10 dark:border-ink-700/40"
            aria-label="Expand sidebar">
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto bg-mesh-light scrollbar-thin">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">Events</h1>
              <p className="mt-1 text-sm text-ink-500">
                {selectedTaskTitle ? `${filteredTasks.length} event(s) in ${selectedTaskTitle}` : `${filteredTasks.length} event(s)`}
              </p>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-surface p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="skeleton h-10 w-10 rounded-xl" />
                    <div className="flex-1">
                      <div className="skeleton h-5 w-3/4 mb-2" />
                      <div className="skeleton h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="skeleton h-4 w-full mb-2" />
                  <div className="skeleton h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="card-surface animate-fade-in-up">
              <EmptyState
                icon={<Calendar className="h-7 w-7" />}
                title="No events found"
                description="Events for this category will appear here."
              />
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <EventCard tasks={filteredTasks} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Event;
