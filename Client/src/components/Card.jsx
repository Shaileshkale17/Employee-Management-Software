const Card = ({ children, className, padding = true, hover = false }) => (
  <div
    className={`relative overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-card ${
      padding ? "p-5 sm:p-6" : ""
    } ${hover ? "card-hover hover:-translate-y-1" : ""} ${className || ""}`}
  >
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80 dark:via-white/10"
      aria-hidden="true"
    />
    {children}
  </div>
);

export default Card;
