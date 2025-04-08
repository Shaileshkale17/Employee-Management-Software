import React, { useState } from "react";
// import logo from "../assets/logo_SVG.png";
import logo from "../assets/ChatGPT Image Apr 7, 2025, 12_02_12 PM (1).svg";
import solar_calendar from "../assets/solar_calendar-broken.svg";
import Notifications from "../assets/Notifications.svg";
import profile from "../assets/user.jpeg";
const Navber = () => {
  const [solar_calendar_Notifications, setsolar_calendar_Notifications] =
    useState(0);
  const [Notificationsnumber, setNotificationsnumber] = useState(0);
  return (
    <div className=" border border-solid border-[#3354F4] shadow-lg bg-white">
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
              />
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navber;
