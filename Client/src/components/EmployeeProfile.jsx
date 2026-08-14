const EmployeeProfile = ({ index, image, name, role, email, phone, status }) => {
  const isActive = status === "Active";

  return (
    <div
      key={index}
      className={`group relative overflow-hidden rounded-2xl border bg-white p-4 transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-card-hover ${
        isActive ? "border-ink-200/70 hover:border-emerald-200" : "border-ink-200/70 hover:border-red-200"
      }`}>
      <div
        className={`absolute inset-x-0 top-0 h-0.5 ${
          isActive ? "bg-gradient-to-r from-emerald-500 to-emerald-400/40" : "bg-gradient-to-r from-red-400 to-red-400/40"
        } opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-xl bg-surface-100 mb-3.5">
        <img
          src={image}
          alt={name}
          className="h-36 w-full object-cover transition-transform duration-500 ease-smooth group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex items-start justify-between gap-2 mb-1">
        <h2 className="text-sm font-semibold text-ink-950 truncate">{name}</h2>
        <span
          className={`chip flex-shrink-0 ring-1 ${
            isActive
              ? "bg-emerald-50 text-emerald-700 ring-emerald-500/20"
              : "bg-red-50 text-red-600 ring-red-500/20"
          }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-400"}`} />
          {status}
        </span>
      </div>
      <p className="text-xs font-semibold text-brand-600 mb-1">{role}</p>
      <p className="text-xs text-ink-400 truncate">{email}</p>
      <p className="text-xs text-ink-400">{phone}</p>
    </div>
  );
};

export default EmployeeProfile;
