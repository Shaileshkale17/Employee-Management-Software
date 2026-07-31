const Button = ({ label, type, loading, disabled, onClick, className, variant = "primary", size = "md" }) => {
  const base = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/20 hover:shadow-xl hover:shadow-brand-600/25 active:scale-[0.98]",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98]",
    ghost: "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 active:scale-[0.98]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className || ""}`}>
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        label
      )}
    </button>
  );
};

export default Button;
