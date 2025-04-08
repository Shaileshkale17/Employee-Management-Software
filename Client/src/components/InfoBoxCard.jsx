import React from "react";

const InfoBoxCard = ({ tasks }) => {
  return (
    <div className="space-y-4">
      {tasks.map((item, index) => (
        <div
          key={index}
          className="bg-white shadow-md rounded-xl p-4 border border-gray-200 hover:shadow-lg transition duration-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {item.title}
          </h2>
          <p className="text-gray-600 mb-2">{item.desc}</p>
          <p className="text-sm text-gray-500">
            {new Date(item.datetime).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default InfoBoxCard;
