import { useEffect, useRef, useState } from "react";
import logo from "../assets/ChatGPT Image Apr 7, 2025, 12_02_12 PM (1).svg";
import Notifications from "../assets/Notifications.svg";
import profile from "../assets/user.jpeg";
import profileIcon from "../assets/logo_SVG.png";
import logoutIcon from "../assets/logoutIcon.svg";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import io from "socket.io-client";
import { api } from "../utils/api";

const Navbar = () => {
  const [notificationsNumber, setNotificationsNumber] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const socketRef = useRef(null);

  const { employeeId, FullName, role, email, img } = user?.user || {};

  const fetchUnread = () => {
    if (!user?.token) return;
    api.get("/notification/unread-count")
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
    const status = isOnline && user?.token ? "Active" : "Inactive";
    socketRef.current.emit("All_update_Status_Info", {
      id: user.user.id,
      isOnline: status,
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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="mx-auto flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center gap-3">
          <img src={logo} alt="App Logo" className="w-12 h-12" />
        </div>
        <nav className="flex items-center gap-2">
          <button
            className="relative rounded-full bg-brand-50 p-2.5 hover:bg-brand-100 transition-colors"
            title="Notifications"
            aria-label="Notifications"
            onClick={() => navigate("/notifications")}
          >
            <img src={Notifications} alt="" className="w-5 h-5" />
            {notificationsNumber > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                {notificationsNumber}
              </span>
            )}
          </button>
          <button
            className="ml-1 rounded-full ring-2 ring-transparent hover:ring-brand-500/30 transition-all"
            onClick={() => setShowProfile(!showProfile)}
            aria-label="Profile"
            title="Profile"
          >
            <img
              src={profile}
              alt=""
              className="w-9 h-9 object-cover rounded-full"
            />
          </button>
        </nav>
      </div>

      {showProfile && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowProfile(false)}
          />
          <div
            ref={profileRef}
            className="absolute right-4 top-[4.5rem] z-50 w-80 animate-fade-in-down"
          >
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
              <p className="text-xs font-medium text-gray-400 text-center uppercase tracking-wider">
                EMP ID: {employeeId}
              </p>
              <div className="flex flex-col items-center gap-3 mt-4">
                <div className="relative">
                  <img
                    className={`w-24 h-24 object-cover rounded-full border-4 ${
                      isOnline ? "border-green-400" : "border-gray-200"
                    }`}
                    src={img || profileIcon}
                    alt={FullName || "Profile"}
                  />
                  <span
                    className={`absolute bottom-1 right-1 w-4 h-4 border-2 border-white rounded-full ${
                      isOnline ? "bg-green-400" : "bg-gray-300"
                    }`}
                  />
                </div>
                <div className="text-center">
                  <h2 className="font-semibold text-gray-900">{FullName}</h2>
                  <p className="text-sm text-gray-500">{role}</p>
                </div>
                <p className="text-sm text-gray-400">{email}</p>
                <button className="w-full bg-brand-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-brand-700 transition-colors focus-ring">
                  Manage your Account
                </button>
                <button
                  className="flex items-center justify-center gap-2 w-full text-red-500 hover:text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors text-sm font-medium"
                  onClick={() => {
                    if (socketRef.current && user?.user?.id) {
                      socketRef.current.emit("All_update_Status_Info", {
                        id: user.user.id,
                        isOnline: "Inactive",
                      });
                    }
                    dispatch(logout());
                  }}
                >
                  <img className="w-4 h-4" src={logoutIcon} alt="" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;
