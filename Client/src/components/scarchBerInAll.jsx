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
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/emp/emp-get`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );
        setData(response.data.data);
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
      console.log(response);
      setData(response.data);
    });

    socket.emit("All_Department_Info");

    socket.on("All_Department_Info_Response", (response) => {
      console.log("All_Department_Info_Response", response.data);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.token]);

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

  const filteredData = data.filter((item) =>
    [item?.name, item?.email, item?.phone, item?.role].some((field) =>
      field?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="flex flex-row w-full">
      {user?.user?.role && SideNav(user.user.role)}
      <div className="w-full min-h-screen flex flex-col justify-center items-center bg-gray-200">
        <div className="h-10 mt-6 flex bg-white p-2 rounded-md ">
          <img src={Searchicon} alt="search icon" />
          <input
            type="text"
            name="search"
            id="search"
            placeholder="Search your employee / manager..."
            className="w-96 p-2 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="h-full mx-5 mt-3 mb-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-3">
          {filteredData.map((item, index) => (
            <EmployeeProfile
              key={item._id || index}
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
