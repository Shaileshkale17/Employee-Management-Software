const iconColors = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  purple: "bg-purple-50 text-purple-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  brand: "bg-brand-50 text-brand-600",
  indigo: "bg-indigo-50 text-indigo-600",
  gray: "bg-gray-50 text-gray-600",
};

const StatCard = ({ label, value, icon, color = "brand", subtitle, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl border border-gray-100 shadow-card p-5 transition-all duration-200 hover:shadow-card-hover ${
      onClick ? "cursor-pointer hover:-translate-y-0.5" : ""
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? 0}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColors[color] || iconColors.brand}`}>
          {icon}
        </div>
      )}
    </div>
  </div>
);

export default StatCard;
