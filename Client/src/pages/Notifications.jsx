import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { api } from "../utils/api";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";

const Notifications = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const role = user?.user?.role;
  const SideNav = (r) => {
    if (r === "developer" || r === "Employee" || r === "Interviewer") return <SideNavbar />;
    if (["Company Admin", "HR", "HR Manager", "Recruiter"].includes(r)) return <HRSideNavber />;
    return null;
  };

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notification", { params: { page, limit: 20 } });
      setNotifications(res.data.data.data || []);
      setTotal(res.data.data.total || 0);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleClick = async (n) => {
    if (n.status === "Unread") {
      try {
        await api.put(`/notification/read/${n._id}`);
        setNotifications((list) => list.map((x) => (x._id === n._id ? { ...x, status: "Read" } : x)));
      } catch { /* ignore */ }
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    try {
      await api.put("/notification/read-all");
      setNotifications((list) => list.map((x) => ({ ...x, status: "Read" })));
    } catch { /* ignore */ }
  };

  const remove = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notification/${id}`);
      setNotifications((list) => list.filter((x) => x._id !== id));
    } catch { /* ignore */ }
  };

  return (
    <div className="flex">
      {SideNav(role)}
      <div className="flex-1 min-h-screen p-4 lg:p-6 bg-surface-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-400 mt-0.5">{total} total</p>
          </div>
          <Button variant="secondary" size="sm" label="Mark all as read" onClick={markAll} />
        </div>

        {loading ? (
          <SkeletonList rows={5} />
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card border border-gray-100">
            <EmptyState title="No notifications" description="You're all caught up." />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-3 bg-white rounded-xl border p-4 text-left transition-colors hover:border-brand-200 ${n.status === "Unread" ? "border-brand-200 shadow-card" : "border-gray-100"}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${n.status === "Unread" ? "bg-brand-600 text-white" : "bg-surface-200 text-gray-500"}`}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.status === "Unread" ? "font-semibold text-gray-900" : "text-gray-600"}`}>{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-300 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {n.status === "Unread" && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1" />}
                  <span onClick={(e) => remove(n._id, e)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" /></svg>
                  </span>
                </button>
              ))}
            </div>

            {total > page * 20 && (
              <div className="flex justify-center mt-6">
                <Button variant="secondary" size="sm" label="Load more" onClick={() => setPage((p) => p + 1)} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;
