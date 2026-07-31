import { Link } from "react-router-dom";

const NotificationsList = ({ title, message, timestamp, type, isRead, link }) => {
  const dateObj = new Date(timestamp);
  const date = dateObj.toLocaleDateString("en-GB");
  const time = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <Link to={link} className="block">
      <div className={`p-3 rounded-lg border transition-all duration-200 hover:bg-white hover:border-gray-200 ${
        isRead ? "bg-gray-50/50 border-gray-50" : "bg-white border-brand-100"
      }`}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className={`text-sm ${isRead ? "font-medium text-gray-700" : "font-semibold text-gray-900"}`}>
            {title}
          </h3>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
            isRead ? "bg-gray-100 text-gray-600" : "bg-brand-50 text-brand-700"
          }`}>
            {isRead ? "Read" : "New"}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-0.5">{date} — {time}</p>
        <p className="text-xs text-gray-400">{type}</p>
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{message}</p>
      </div>
    </Link>
  );
};

export default NotificationsList;
