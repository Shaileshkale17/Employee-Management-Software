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
      className="bg-white relative shadow-md rounded-xl p-4 border border-gray-200 hover:shadow-lg transition duration-300 h-96">
      <img src={image} alt="" className="w-full" />

      <div className="">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{name}</h2>
        <p className=" font-semibold text-gray-800 mb-2">{role}</p>
        <div>
          <p className="text-gray-600 mb-2">{email}</p>
          <p className="text-gray-600 mb-2">{phone}</p>
        </div>
        <p className="text-sm text-gray-500">{status}</p>
      </div>
    </div>
  );
};

export default EmployeeProfile;
