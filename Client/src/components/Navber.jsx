import React, { useState } from "react";
// import logo from "../assets/logo_SVG.png";
import logo from "../assets/ChatGPT Image Apr 7, 2025, 12_02_12 PM (1).svg";
import solar_calendar from "../assets/solar_calendar-broken.svg";
import Notifications from "../assets/Notifications.svg";
import profile from "../assets/user.jpeg";
import { useDispatch, useSelector } from "react-redux";
import profileIcon from "../assets/logo_SVG.png";
import logoutIcon from "../assets/logoutIcon.svg";
import { logout } from "../redux/slices/authSlice";
const Navber = () => {
  const [solar_calendar_Notifications, setsolar_calendar_Notifications] =
    useState(0);
  const [Notificationsnumber, setNotificationsnumber] = useState(0);
  const [showProfile, setshowProfile] = useState(false);
  const { user } = useSelector((staet) => staet.auth);
  const dispatch = useDispatch();

  const LogoutUser = () => {
    dispatch(logout());
    // window.location.reload();
  };

  console.log(user?.user);
  return (
    <div className=" border border-solid border-[#3354F4] shadow-lg bg-white relative">
      <div className="mx-0 md:mx-2  flex flex-row justify-between items-center lg:px-5 ">
        <div>
          <img src={logo} alt="logo" className="w-[4.5rem] h-[4.5rem]" />
        </div>
        <div>
          <ul className="flex flex-row items-center gap-4">
            <li className="rounded-full bg-[#CFD7FD] p-2  relative">
              <img src={solar_calendar} alt="solar calendar" />
              {solar_calendar_Notifications === 0 || (
                <span className="absolute top-5 right-0 bg-[#ff000076] text-center w-6 h-6 rounded-full text-white ">
                  {solar_calendar_Notifications}
                </span>
              )}
            </li>
            <li className="  rounded-full bg-[#CFD7FD] p-2 relative">
              <img src={Notifications} alt="Notification" />
              {Notificationsnumber === 0 || (
                <span className="absolute top-5 right-0 bg-[#ff000076] text-center w-6 h-6 rounded-full text-white ">
                  {Notificationsnumber}
                </span>
              )}
            </li>
            <li className="w-11 rounded-full ">
              <img
                src={profile}
                alt="profile"
                className="w-12 h-12 object-cover rounded-full"
                onClick={() => setshowProfile(!showProfile)}
              />
            </li>
          </ul>
        </div>
      </div>
      <div className="absolute right-1 top-12 z-50">
        {showProfile && (
          <div className="h-96 w-80 bg-white rounded-lg shadow-lg p-4 flex flex-col ">
            {/* Replace 'dsfdsf' with your actual profile content */}
            <p className="text-gray-800 text-sm text-center">
              EMP ID: {user?.user?.employeeId}
            </p>
            <div className="flex justify-center items-center flex-col gap-2">
              <img
                className="w-28 h-28 object-cover rounded-full mt-5 border-2 border-[#0c7df4] "
                src={user?.user?.img || profileIcon}
                alt={user?.user?.FullName || "profileIcon"}
              />
              <div className="flex flex-col justify-center items-center">
                <h2 className="font-medium text-lg">{user?.user?.FullName}</h2>
                <p className="font-light text-sm">{user?.user?.role}</p>
              </div>
              <div className="flex flex-col gap-4 justify-center items-center">
                <p className="font-medium text-md">{user?.user?.email}</p>
                <button className="bg-[#0c7df4] text-white border hover:text-[#0c7df4] hover:bg-white hover:border-[#0c7df4] px-5 py-2 rounded-lg text-center  ">
                  Manage your Account
                </button>
              </div>
              <p
                className="mt-3 flex flex-row text-center items-center text-red-500 cursor-pointer"
                onClick={() => LogoutUser()}>
                <img className="w-7 h-7" src={logoutIcon} alt="Logout Icon" />
                Sign out
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navber;
