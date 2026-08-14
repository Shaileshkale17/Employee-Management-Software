const Heading = ({ heading, className, subtitle, icon }) => {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-glow-sm">
            {icon}
          </span>
        )}
        <h1 className={`text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl ${className || ""}`}>
          {heading}
        </h1>
      </div>
      {subtitle && <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>}
    </div>
  );
};

export default Heading;
