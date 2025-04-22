import React, { useEffect, useRef, useState } from "react";
import logo from "../assets/ChatGPT Image Apr 7, 2025, 12_02_12 PM (1).svg";
import solar_calendar from "../assets/solar_calendar-broken.svg";
import Notifications from "../assets/Notifications.svg";
import profile from "../assets/user.jpeg";
import profileIcon from "../assets/logo_SVG.png";
import logoutIcon from "../assets/logoutIcon.svg";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice";

const Navbar = () => {
  const [solarCalendarNotifications, setSolarCalendarNotifications] =
    useState(0);
  const [notificationsNumber, setNotificationsNumber] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const profileRef = useRef(null);

  const { employeeId, FullName, role, email, img } = user?.user || {};

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
    <div className="border border-solid border-[#3354F4] shadow-lg bg-white relative">
      <div className="mx-0 md:mx-2 flex flex-row justify-between items-center lg:px-5">
        <div>
          <img src={logo} alt="App Logo" className="w-[4.5rem] h-[4.5rem]" />
        </div>
        <div>
          <ul className="flex flex-row items-center gap-4">
            <li
              className="rounded-full bg-[#CFD7FD] p-2 relative"
              title="Calendar Alerts">
              <img src={solar_calendar} alt="Solar Calendar" />
              {solarCalendarNotifications > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {solarCalendarNotifications}
                </span>
              )}
            </li>
            <li
              className="rounded-full bg-[#CFD7FD] p-2 relative"
              title="Notifications">
              <img src={Notifications} alt="Notifications" />
              {notificationsNumber > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {notificationsNumber}
                </span>
              )}
            </li>
            <li className="w-11 rounded-full" title="Profile">
              <img
                src={profile}
                alt="User Profile Icon"
                className="w-12 h-12 object-cover rounded-full cursor-pointer"
                onClick={() => setShowProfile(!showProfile)}
              />
            </li>
          </ul>
        </div>
      </div>

      {showProfile && (
        <div className="absolute right-1 top-12 z-50" ref={profileRef}>
          <div className="h-96 w-80 bg-white rounded-lg shadow-lg p-4 flex flex-col">
            <p className="text-gray-800 text-sm text-center">
              EMP ID: {employeeId}
            </p>
            <div className="flex justify-center items-center flex-col gap-2">
              <img
                className={`w-28 h-28 object-cover rounded-full mt-5 border-2 ${
                  isOnline ? "border-green-500" : "border-[#0c7df4]"
                }`}
                src={img || profileIcon}
                alt={FullName || "Profile Picture"}
              />
              <div className="flex flex-col justify-center items-center">
                <h2 className="font-medium text-lg">{FullName}</h2>
                <p className="font-light text-sm">{role}</p>
              </div>
              <div className="flex flex-col gap-4 justify-center items-center">
                <p className="font-medium text-md">{email}</p>
                <button className="bg-[#0c7df4] text-white border hover:text-[#0c7df4] hover:bg-white hover:border-[#0c7df4] px-5 py-2 rounded-lg text-center">
                  Manage your Account
                </button>
              </div>
              <p
                className="mt-3 flex flex-row text-center items-center text-red-500 cursor-pointer"
                onClick={() => dispatch(logout())}>
                <img className="w-7 h-7" src={logoutIcon} alt="Logout Icon" />
                Sign out
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
