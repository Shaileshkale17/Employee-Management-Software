import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, Menu, Search, Settings } from "lucide-react";
import logo from "../assets/ChatGPT Image Apr 7, 2025, 12_02_12 PM (1).svg";
import profile from "../assets/user.jpeg";
import profileIcon from "../assets/logo_SVG.png";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import io from "socket.io-client";
import { api } from "../utils/api";
import GlobalSearch from "./GlobalSearch";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const [notificationsNumber, setNotificationsNumber] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const socketRef = useRef(null);

  const { employeeId, FullName, role, email, img } = user?.user || {};

  const fetchUnread = () => {
    if (!user?.token) return;
    api
      .get("/notification/unread-count")
      .then((res) => setNotificationsNumber(res.data.data.count || 0))
      .catch(() => {});
  };

  useEffect(() => {
    socketRef.current = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3000",
    );

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      socketRef.current?.disconnect();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current || !user?.user?.id) return;
    socketRef.current.emit("register", user.user.id);
    const isActive = !!(isOnline && user?.token);
    socketRef.current.emit("All_update_Status_Info", {
      id: user.user.id,
      isOnline: isActive,
    });
    fetchUnread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, user?.token, user?.user?.id]);

  useEffect(() => {
    if (!socketRef.current) return;
    const handleNewNotification = ({ recipient, notification }) => {
      if (recipient && notification && recipient !== String(user?.user?.id)) return;
      if (notification?.recipient && notification.recipient !== user?.user?.id) return;
      setNotificationsNumber((n) => n + 1);
      toast.info(notification?.title || "New notification", {
        onClick: () => navigate("/notifications"),
      });
    };
    socketRef.current.on("notification:new", handleNewNotification);
    return () => {
      socketRef.current?.off("notification:new", handleNewNotification);
    };
  }, [user?.user?.id, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setShowProfile(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="glass sticky top-0 z-50 border-b border-ink-200/60 shadow-sm">
      <div className="mx-auto flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center gap-3">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100 md:hidden dark:hover:bg-white/10"
            onClick={() => window.dispatchEvent(new Event("open-mobile-nav"))}
            title="Menu"
            aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/overview" className="transition-transform duration-200 hover:scale-105">
            <img src={logo} alt="App Logo" className="w-11 h-11" />
          </Link>
          <span className="hidden sm:block text-[11px] font-medium uppercase tracking-widest text-ink-400">
            Employee Suite
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <span
            className={`hidden xl:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ${
              isOnline
                ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20"
                : "bg-ink-100 text-ink-500 ring-1 ring-ink-200 dark:bg-white/5 dark:text-ink-400 dark:ring-ink-700/60"
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-ink-400"}`} />
            {isOnline ? "Online" : "Offline"}
          </span>

          <button
            className="hidden md:flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-2 text-sm text-ink-500 ring-1 ring-ink-200 shadow-sm transition-all duration-200 hover:bg-brand-50 hover:ring-brand-200 hover:text-ink-700 active:scale-95 dark:bg-white/10 dark:ring-ink-700/60 dark:text-ink-400 dark:hover:bg-white/15 dark:hover:text-ink-900"
            onClick={() => setSearchOpen(true)}
            title="Search (Ctrl+K)"
            aria-label="Search">
            <Search className="h-4 w-4" />
            <span className="hidden xl:inline">Search</span>
            <kbd className="hidden lg:inline-flex items-center rounded-md border border-ink-300 bg-surface-50 px-1.5 py-0.5 text-[10px] font-medium text-ink-400 dark:border-ink-600 dark:bg-surface-800/50">
              Ctrl K
            </kbd>
          </button>

          <button
            className="rounded-full bg-white/80 p-2.5 ring-1 ring-ink-200 shadow-sm transition-all duration-200 hover:bg-brand-50 hover:ring-brand-200 active:scale-95 md:hidden dark:bg-white/10 dark:ring-ink-700/60 dark:hover:bg-white/15"
            onClick={() => setSearchOpen(true)}
            title="Search"
            aria-label="Search">
            <Search className="h-5 w-5 text-brand-600" />
          </button>

          <ThemeToggle />

          <button
            className="relative rounded-full bg-white/80 p-2.5 ring-1 ring-ink-200 shadow-sm transition-all duration-200 hover:bg-brand-50 hover:ring-brand-200 hover:shadow-md active:scale-95 dark:bg-white/10 dark:ring-ink-700/60 dark:hover:bg-white/15"
            title="Notifications"
            aria-label="Notifications"
            onClick={() => navigate("/notifications")}>
            <Bell className="h-5 w-5 text-brand-600" />
            {notificationsNumber > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-[18px] h-[18px] rounded-full flex items-center justify-center font-semibold shadow-sm ring-2 ring-white animate-pop">
                {notificationsNumber > 99 ? "99+" : notificationsNumber}
              </span>
            )}
          </button>

          <button
            className="ml-1 rounded-full p-0.5 ring-2 ring-transparent transition-all duration-200 hover:ring-brand-500/40 focus-visible:outline-none focus-visible:ring-brand-500/60"
            onClick={() => setShowProfile(!showProfile)}
            aria-label="Profile"
            title="Profile"
            aria-expanded={showProfile}>
            <img
              src={profile}
              alt=""
              className="w-9 h-9 object-cover rounded-full border border-ink-200 dark:border-ink-700"
            />
          </button>
        </div>
      </div>

      {showProfile && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
          <div
            ref={profileRef}
            className="absolute right-4 top-[4.25rem] z-50 w-80 max-w-[calc(100vw-2rem)] animate-fade-in-down">
            <div className="card-surface overflow-hidden p-6 shadow-popover">
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent" aria-hidden="true" />
              <p className="relative text-[11px] font-semibold text-ink-400 text-center uppercase tracking-widest">
                EMP ID: {employeeId}
              </p>
              <div className="relative flex flex-col items-center gap-3 mt-4">
                <div className="relative">
                  <img
                    className={`w-24 h-24 object-cover rounded-full border-4 shadow-lg ${
                      isOnline ? "border-emerald-400" : "border-ink-200"
                    }`}
                    src={img || profileIcon}
                    alt={FullName || "Profile"}
                  />
                  <span
                    className={`absolute bottom-1.5 right-1.5 w-4 h-4 border-2 border-white rounded-full ${
                      isOnline ? "bg-emerald-400" : "bg-ink-300"
                    }`}
                  />
                </div>
                <div className="text-center">
                  <h2 className="font-bold text-ink-950">{FullName}</h2>
                  <p className="text-sm text-ink-500 mt-0.5">{role}</p>
                </div>
                <p className="text-[13px] text-ink-400">{email}</p>

                <Link
                  to="/company-settings"
                  onClick={() => setShowProfile(false)}
                  className="btn-primary btn-md w-full">
                  <Settings className="h-4 w-4" />
                  Manage your Account
                </Link>

                <button
                  className="flex items-center justify-center gap-2 w-full text-red-500 hover:text-red-600 hover:bg-red-50 py-2.5 rounded-xl transition-colors text-sm font-medium focus-ring dark:hover:bg-red-500/10"
                  onClick={() => {
                    if (socketRef.current && user?.user?.id) {
                      socketRef.current.emit("All_update_Status_Info", {
                        id: user.user.id,
                        isOnline: false,
                      });
                    }
                    dispatch(logout());
                  }}>
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onRequestOpen={() => setSearchOpen(true)}
      />
    </header>
  );
};

export default Navbar;
