import { Link } from "react-router-dom";

const NotificationsList = ({ title, message, timestamp, type, isRead, link }) => {
  const dateObj = new Date(timestamp);
  const date = dateObj.toLocaleDateString("en-GB");
  const time = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <Link to={link} className="block group">
      <div
        className={`relative flex items-start gap-3 rounded-xl border p-3.5 transition-all duration-300 ease-smooth group-hover:shadow-card-hover ${
          isRead
            ? "border-ink-200/50 bg-ink-50/40 group-hover:bg-white group-hover:border-ink-300"
            : "border-brand-100 bg-brand-50/40 group-hover:bg-brand-50"
        }`}>
        <span
          className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
            isRead ? "bg-ink-300" : "bg-brand-500 animate-pulse-soft"
          }`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-sm truncate ${isRead ? "font-medium text-ink-700" : "font-semibold text-ink-900"}`}>
              {title}
            </h3>
            <span
              className={`chip flex-shrink-0 ${
                isRead ? "bg-ink-100 text-ink-500" : "bg-brand-100 text-brand-700"
              }`}>
              {isRead ? "Read" : "New"}
            </span>
          </div>
          <p className="text-xs text-ink-400 mt-0.5">
            {date} — {time}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400 mt-0.5">{type}</p>
          <p className="text-[13px] text-ink-600 mt-1 line-clamp-2 leading-relaxed">{message}</p>
        </div>
      </div>
    </Link>
  );
};

export default NotificationsList;
