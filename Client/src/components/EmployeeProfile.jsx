import { Mail, MapPin } from "lucide-react";
import { getInitials, mapEmployeeSummary, presenceMeta, statusMeta } from "../utils/employeeMappers";

const EmployeeProfile = ({ item, onClick }) => {
  const s = mapEmployeeSummary(item);
  const presence = presenceMeta(s.presence);
  const subtitle = [s.designation, s.department].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      aria-label={`View profile of ${s.name || "employee"}`}
      className="card-surface group w-full p-4 text-left focus-ring transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover dark:border-ink-700/40 dark:bg-surface-200">
      <div className="flex items-start gap-3">
        {s.profileImg ? (
          <img
            src={s.profileImg}
            alt={s.name}
            className="h-12 w-12 flex-shrink-0 rounded-full object-cover ring-1 ring-ink-200 dark:ring-ink-700/60"
          />
        ) : (
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-bold text-white ring-1 ring-ink-200 dark:ring-ink-700/60">
            {getInitials(s.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-ink-950">{s.name || "—"}</h3>
            <span
              className={`relative flex h-2 w-2 flex-shrink-0 rounded-full ${presence.dot}`}
              title={presence.label}
              aria-label={presence.label}
            />
          </div>
          {s.designation && <p className="truncate text-xs font-medium text-brand-600">{s.designation}</p>}
          {subtitle && <p className="mt-0.5 truncate text-xs text-ink-400">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-3 space-y-1.5 border-t border-ink-100 pt-3 dark:border-ink-700/40">
        {s.email && (
          <p className="flex items-center gap-2 truncate text-xs text-ink-500 dark:text-ink-400">
            <Mail className="h-3.5 w-3.5 flex-shrink-0 text-ink-300 dark:text-ink-600" />
            <span className="truncate">{s.email}</span>
          </p>
        )}
        {s.workLocation && (
          <p className="flex items-center gap-2 truncate text-xs text-ink-500 dark:text-ink-400">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-ink-300 dark:text-ink-600" />
            <span className="truncate">{s.workLocation}</span>
          </p>
        )}
        <div className="flex items-center justify-between gap-2 pt-1">
          {s.employeeId && (
            <span className="text-[11px] font-medium text-ink-400 dark:text-ink-500">ID: {s.employeeId}</span>
          )}
          {s.status && (
            <span className={`chip ring-1 ${statusMeta(s.status)}`}>
              {s.status}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default EmployeeProfile;
