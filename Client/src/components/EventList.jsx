import React from "react";

const EventList = ({
  title,
  date,
  time,
  description,
  organizer,
  type,
  status,
}) => {
  const statusColor =
    status === "Upcoming"
      ? "bg-green-100 text-green-700"
      : status === "Completed"
      ? "bg-blue-100 text-blue-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <div className="p-4 flex flex-col mb-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition relative ">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span
          className={`px-3 py-1 text-xs rounded-full absolute right-0 -top-1 ${statusColor}`}>
          {status}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-1">
        <strong>Date:</strong> {date} — <strong>Time:</strong> {time}
      </p>
      <p className="text-sm text-gray-600 mb-1">
        <strong>Organizer:</strong> {organizer}
      </p>
      <p className="text-sm text-gray-600 mb-1">
        <strong>Type:</strong> {type}
      </p>
      <p className="text-sm text-gray-800">{description}</p>
    </div>
  );
};

export default EventList;
