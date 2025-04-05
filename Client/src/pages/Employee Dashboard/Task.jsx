import React from "react";
import SideNavbar from "../../components/SideNavber";
const Task = () => {
  return (
    <div className="flex flex-row w-full">
      <SideNavbar />
      <div className="w-full h-screen flex justify-center items-center bg-gray-200">
        Task
      </div>
    </div>
  );
};

export default Task;
