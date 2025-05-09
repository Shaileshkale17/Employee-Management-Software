import React from "react";

const EmployeeProfile = ({
  index,
  image,
  name,
  role,
  email,
  phone,
  status,
}) => {
  return (
    <div
      key={index}
      className={`bg-white relative shadow-md rounded-xl p-4 border ${
        status == "Active" ? "border-green-500" : "border-red-500"
      } hover:shadow-lg border-2 transition duration-300 h-[19rem]`}>
      <img src={image} alt="" className="w-70 h-70" />

      <div className="">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 ">{name}</h2>
          <p className="text-sm text-gray-500">{status}</p>
        </div>
        <p className=" font-semibold text-gray-800 mb-1">{role}</p>
        <div>
          <p className="text-gray-600 mb-1">{email}</p>
          <p className="text-gray-600 mb-2">{phone}</p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
