import React, { useEffect, useState } from "react";
import SideNavbar from "./SideNavber";
import logo from "../assets/ChatGPT Image Apr 7, 2025, 12_02_12 PM (1).svg";
import Searchicon from "../assets/iconamoon_search-thin.svg";
import EmployeeProfile from "./EmployeeProfile";
import { useSelector } from "react-redux";
import HRSideNavber from "./HRSideNavber";
import { io } from "socket.io-client";
import axios from "axios";
const SearchBarInAll = () => {
  const [Search, setSearch] = useState("");
  const [Data, setData] = useState([]);
  const { user } = useSelector((state) => state.auth);
  useEffect(() => {
    const fetchData = async () => {
      try {
        let mydata = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/emp/emp-get`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        setData(mydata.data.data);
      } catch (error) {
        console.error("Error fetching initial employee data:", error);
      }
    };

    fetchData();

    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:8080"
    );

    socket.on("connect", () => {
      console.log("Socket ID:", socket.id);
    });

    socket.emit("All_Employee_Info");

    socket.on("All_Employee_Info_Response", (response) => {
      setData(response.data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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

  return (
    <div className="flex flex-row w-full">
      {SideNav(user.user.role)}
      <div className="w-full min-h-screen flex flex-col justify-center items-center bg-gray-200">
        <div className="h-10 mt-6 flex bg-white p-2 rounded-md ">
          <img src={Searchicon} alt="" />
          <input
            type="text"
            name="Search"
            id="Search"
            placeholder="Search your employee / manager..."
            className="w-96 p-2 outline-none"
            value={Search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="h-full mx-5 mt-3 mb-2 grid col-span-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 xl:grid-cols-5 ">
          {Data.filter(
            (item) =>
              item?.name
                ?.toLocaleLowerCase()
                ?.includes(Search?.toLocaleLowerCase()) ||
              item?.email
                ?.toLocaleLowerCase()
                ?.includes(Search?.toLocaleLowerCase()) ||
              item?.phone
                ?.toLocaleLowerCase()
                ?.includes(Search?.toLocaleLowerCase()) ||
              item?.role
                ?.toLocaleLowerCase()
                ?.includes(Search?.toLocaleLowerCase())
          ).map((item, index) => (
            <EmployeeProfile
              index={index}
              image={item.image || logo}
              email={
                item.email.length >= 17
                  ? item.email.slice(0, 17) + "..."
                  : item.email
              }
              name={
                item.name.length >= 13
                  ? item.name.slice(0, 13) + "..."
                  : item.name
              }
              phone={item.phone}
              role={item.role}
              status={item.status}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchBarInAll;
