import React, { useState } from "react";
import SideNavbar from "./SideNavber"; // fix this if the filename was wrong
import Searchicon from "../assets/iconamoon_search-thin.svg";
import EmployeeProfile from "./EmployeeProfile";
const SearchBarInAll = () => {
  const [Search, setSearch] = useState("");

  const arr = [
    {
      id: 1,
      name: "Aarav Sharma",
      email: "aarav.sharma@example.com",
      phone: "+91-9876543210",
      department: "Engineering",
      role: "Frontend Developer",
      joiningDate: "2023-06-15",
      status: "Active",
      image: "https://randomuser.me/api/portraits/men/75.jpg",
    },
    {
      id: 2,
      name: "Isha Kapoor",
      email: "isha.kapoor@example.com",
      phone: "+91-9123456780",
      department: "Human Resources",
      role: "HR Manager",
      joiningDate: "2022-04-01",
      status: "Active",
      image: "https://randomuser.me/api/portraits/women/65.jpg",
    },
    {
      id: 3,
      name: "Rohan Mehta",
      email: "rohan.mehta@example.com",
      phone: "+91-9988776655",
      department: "Sales",
      role: "Sales Executive",
      joiningDate: "2021-11-20",
      status: "Inactive",
      image: "https://randomuser.me/api/portraits/men/45.jpg",
    },
    {
      id: 4,
      name: "Neha Verma",
      email: "neha.verma@example.com",
      phone: "+91-9090909090",
      department: "Marketing",
      role: "Content Strategist",
      joiningDate: "2023-01-10",
      status: "Active",
      image: "https://randomuser.me/api/portraits/women/47.jpg",
    },
    {
      id: 5,
      name: "Kunal Joshi",
      email: "kunal.joshi@example.com",
      phone: "+91-9876501234",
      department: "Engineering",
      role: "Backend Developer",
      joiningDate: "2022-09-05",
      status: "Active",
      image: "https://randomuser.me/api/portraits/men/38.jpg",
    },
  ];

  return (
    <div className="flex flex-row w-full">
      <SideNavbar />
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
        <div className="h-full my-5 grid col-span-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 xl:grid-cols-4">
          {arr
            .filter(
              (item) =>
                item.name
                  .toLocaleLowerCase()
                  .includes(Search.toLocaleLowerCase()) ||
                item.email
                  .toLocaleLowerCase()
                  .includes(Search.toLocaleLowerCase()) ||
                item.phone
                  .toLocaleLowerCase()
                  .includes(Search.toLocaleLowerCase()) ||
                item.role
                  .toLocaleLowerCase()
                  .includes(Search.toLocaleLowerCase())
            )
            .map((item, index) => (
              <EmployeeProfile
                index={index}
                image={item.image}
                email={item.email}
                name={item.name}
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
