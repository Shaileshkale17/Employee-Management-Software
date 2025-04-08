import React, { useState } from "react";
import SideNavbar from "../../components/SideNavber";
import arrowRight from "../../assets/material-symbols-light_arrow-back-rounded-1.svg";
import arrowLeft from "../../assets/material-symbols-light_arrow-back-rounded.svg";
import ChatArea from "../../components/ChatArea";

const Message = () => {
  const [ClickShow, setClickShow] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const users = [
    { name: "Shailesh Kale", role: "Frontend Developer", online: true },
    { name: "Aarav Mehta", role: "Backend Developer", online: false },
    { name: "Ishita Roy", role: "UI/UX Designer", online: true },
    { name: "Rajesh Nair", role: "Project Manager", online: true },
    { name: "Simran Kaur", role: "QA Engineer", online: false },
    { name: "Manish Tiwari", role: "DevOps Engineer", online: true },
    { name: "Sneha Deshmukh", role: "Product Owner", online: false },
    { name: "Aditya Bhatt", role: "Full Stack Developer", online: true },
    { name: "Neha Verma", role: "Content Writer", online: false },
    { name: "Vikram Singh", role: "Scrum Master", online: true },
  ];

  return (
    <div className="flex w-full">
      <SideNavbar />
      <div className="w-full flex h-screen">
        {/* Sidebar */}
        <div
          className={`relative ${
            ClickShow ? "w-[25%]" : "w-2"
          } p-4 min-h-svh overflow-y-auto transition-all duration-300`}>
          {ClickShow ? (
            <>
              <img
                src={arrowLeft}
                alt="collapse"
                onClick={() => setClickShow(false)}
                className="w-6 h-6 absolute right-2 top-2 cursor-pointer"
              />
              <ul className="flex flex-col gap-4 mt-8">
                {users.map((user, index) => (
                  <li key={index}>
                    <button
                      onClick={() => setSelectedUser(user)}
                      className={`w-full text-start px-4 py-2 rounded-md transition-all ${
                        selectedUser?.name === user.name
                          ? "bg-gray-700 text-white"
                          : "text-gray-800 hover:text-white hover:bg-gray-400"
                      }`}>
                      {user.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <img
              src={arrowRight}
              alt="expand"
              onClick={() => setClickShow(true)}
              className="w-6 h-6 absolute left-2 top-2 cursor-pointer"
            />
          )}
        </div>

        {/* Chat Area */}
        <ChatArea selectedUser={selectedUser} />
      </div>
    </div>
  );
};

export default Message;
