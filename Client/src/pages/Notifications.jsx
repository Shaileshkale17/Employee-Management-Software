import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { api } from "../utils/api";
import Button from "../components/Button";
import Heading from "../components/Heading";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";
import { Bell, Trash2 } from "lucide-react";

const Notifications = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const role = user?.user?.role;
  const SideNav = (r) => {
    if (r === "developer" || r === "Employee" || r === "Interviewer") return <SideNavbar />;
    if (["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(r)) return <HRSideNavber />;
    return null;
  };

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notification", { params: { page, limit: 20 } });
      const list = res.data.data.data || [];
      setNotifications((prev) => (page === 1 ? list : [...prev, ...list]));
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
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-in-down">
            <Heading heading="Notifications" subtitle={`${total} total`} />
            <Button variant="secondary" size="sm" label="Mark all as read" onClick={markAll} />
          </div>

          {loading ? (
            <div className="animate-fade-in">
              <SkeletonList rows={5} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="card-surface animate-fade-in-up">
              <EmptyState
                icon={<Bell className="h-7 w-7" />}
                title="No notifications"
                description="You're all caught up."
              />
            </div>
          ) : (
            <>
              <div className="space-y-3 animate-fade-in-up">
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleClick(n)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleClick(n);
                      }
                    }}
                    className={`w-full flex items-start gap-3 card-surface p-4 text-left transition-all duration-200 ease-smooth focus-ring cursor-pointer ${
                      n.status === "Unread"
                        ? "border-brand-200/70 hover:shadow-card-hover"
                        : "border-ink-200/40 hover:border-ink-300/70 hover:shadow-card-hover"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${n.status === "Unread" ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-sm" : "bg-surface-200 text-ink-500"}`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${n.status === "Unread" ? "font-semibold text-ink-950" : "text-ink-700"}`}>{n.title}</p>
                      <p className="text-xs text-ink-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-ink-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    {n.status === "Unread" && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1 animate-pulse-soft" />}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(n._id, e);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          e.preventDefault();
                          remove(n._id, e);
                        }
                      }}
                      aria-label="Delete notification"
                      className="text-ink-300 hover:text-red-500 transition-colors flex-shrink-0 focus-ring rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {total > page * 20 && (
                <div className="flex justify-center pt-2">
                  <Button variant="secondary" size="sm" label="Load more" onClick={() => setPage((p) => p + 1)} />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
