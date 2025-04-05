import React from "react";
import { Link } from "react-router-dom";

const NotificationsList = ({
  title,
  message,
  timestamp,
  type,
  isRead,
  link,
}) => {
  const dateObj = new Date(timestamp);
  const date = dateObj.toLocaleDateString("en-GB");
  const time = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const status = isRead ? "Read" : "Unread";

  const statusColor = isRead
    ? "bg-blue-100 text-blue-700"
    : "bg-yellow-100 text-yellow-700";

  return (
    <Link to={link} className="block">
      <div className="p-4 flex flex-col mb-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition relative">
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
          <strong>Type:</strong> {type}
        </p>
        <p className="text-sm text-gray-800">{message}</p>
      </div>
    </Link>
  );
};

export default NotificationsList;
