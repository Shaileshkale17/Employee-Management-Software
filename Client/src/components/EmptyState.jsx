const EmptyState = ({ icon, title, description, action, className }) => (
  <div className={`flex flex-col items-center justify-center text-center py-14 px-6 ${className || ""}`}>
    {icon && (
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 opacity-60 blur-lg dark:from-brand-500/30 dark:to-brand-500/10" aria-hidden="true" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-ink-300 shadow-card ring-1 ring-ink-200/60">
          {icon}
        </div>
      </div>
    )}
    <h3 className="text-sm font-semibold text-ink-800">{title}</h3>
    {description && (
      <p className="text-xs text-ink-400 mt-1 max-w-xs leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
