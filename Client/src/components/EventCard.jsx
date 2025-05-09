import React from "react";

const EventCard = ({ tasks }) => {
  return (
    <div className=" grid col-span-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 xl:grid-cols-4">
      {tasks.map((item, index) => (
        <div
          key={index}
          className={`bg-white shadow-md rounded-xl p-4 border border-gray-200 hover:shadow-lg transition duration-300`}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 h-10 ">
            {item.title.length > 25
              ? item.title.slice(0, 25) + "..."
              : item.title}
          </h2>
          <p className="text-gray-600 mb-2 h-24">
            {item.desc.length >= 82
              ? item.desc.slice(0, 82) + "..."
              : item.desc}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(item.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default EventCard;
