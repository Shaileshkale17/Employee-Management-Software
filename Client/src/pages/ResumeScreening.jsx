import React from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { useSelector } from "react-redux";

const ResumeScreening = () => {
  const { user } = useSelector((state) => state.auth);
  console.log(user.user.role);

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
      <div className="w-full h-screen flex justify-center items-center bg-gray-200">
        Resume Screening
      </div>
    </div>
  );
};

export default ResumeScreening;
