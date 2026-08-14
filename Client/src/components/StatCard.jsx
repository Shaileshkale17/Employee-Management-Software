import { ChevronUp, ChevronDown } from "lucide-react";

const iconColors = {
  blue: "bg-blue-50 text-blue-600 ring-blue-500/10",
  green: "bg-emerald-50 text-emerald-600 ring-emerald-500/10",
  purple: "bg-purple-50 text-purple-600 ring-purple-500/10",
  amber: "bg-amber-50 text-amber-600 ring-amber-500/10",
  red: "bg-red-50 text-red-600 ring-red-500/10",
  brand: "bg-brand-50 text-brand-600 ring-brand-500/10",
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-500/10",
  teal: "bg-teal-50 text-teal-600 ring-teal-500/10",
  rose: "bg-rose-50 text-rose-600 ring-rose-500/10",
  gray: "bg-ink-100 text-ink-600 ring-ink-500/10",
};

const trendStyles = {
  up: "text-emerald-600 bg-emerald-50",
  down: "text-red-600 bg-red-50",
  neutral: "text-ink-500 bg-ink-100",
};

const StatCard = ({ label, value, icon, color = "brand", subtitle, trend, trendLabel, onClick }) => (
  <div
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={
      onClick
        ? (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          }
        : undefined
    }
    className={`group relative overflow-hidden rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card transition-all duration-300 ease-smooth ${
      onClick
        ? "cursor-pointer hover:-translate-y-1 hover:shadow-card-hover hover:border-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
        : "hover:shadow-card-hover"
    }`}>
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink-200 to-transparent opacity-70"
      aria-hidden="true"
    />
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</p>
        <p className="mt-1.5 text-[26px] leading-none font-bold tracking-tight text-ink-950 tabular-nums">
          {value ?? 0}
        </p>
        {subtitle && <p className="mt-1.5 text-xs text-ink-400">{subtitle}</p>}
        {trend && (
          <p className="mt-2 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${trendStyles[trend] || trendStyles.neutral}`}>
              {trend === "up" && (
                <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
              )}
              {trend === "down" && (
                <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
              )}
              {trendLabel}
            </span>
          </p>
        )}
      </div>
      {icon && (
        <div
          className={`relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-300 ease-smooth group-hover:scale-105 ${
            iconColors[color] || iconColors.brand
          }`}>
          {icon}
        </div>
      )}
    </div>
  </div>
);

export default StatCard;
