const STATUS_STYLES = {
  upcoming: "bg-brand-50 text-brand-700 ring-brand-500/20",
  live: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  completed: "bg-ink-100 text-ink-600 ring-ink-400/20",
  cancelled: "bg-red-50 text-red-600 ring-red-500/20",
};

export const MeetingStatusBadge = ({ status }) => {
  const s = status || "upcoming";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
        STATUS_STYLES[s] || STATUS_STYLES.upcoming
      }`}>
      {s === "live" && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      )}
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
};

