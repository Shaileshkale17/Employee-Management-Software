const EventList = ({ title, date, time,   organizer, type, status }) => {
  const statusStyles = {
    Upcoming: "bg-emerald-50 text-emerald-700",
    Completed: "bg-blue-50 text-blue-700",
    default: "bg-amber-50 text-amber-700",
  };

  const statusClass = statusStyles[status] || statusStyles.default;

  return (
    <div className="p-3 rounded-lg border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-gray-200 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusClass}`}>
          {status}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-1">
        {date} — {time}
      </p>
      <p className="text-xs text-gray-500">
        <span className="font-medium">Organizer:</span> {organizer} &middot; <span className="font-medium">Type:</span> {type}
      </p>
    </div>
  );
};

export default EventList;
