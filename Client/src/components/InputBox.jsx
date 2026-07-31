import { forwardRef } from "react";

const InputBox = forwardRef(({
  name,
  type = "text",
  id,
  label,
  setInput,
  getInput,
  placeholder,
  icon,
  error,
  onBlur,
  children,
  className,
}, ref) => {
  const handleChange = (event) => {
    setInput(event.target.value);
  };
  return (
    <div className={`flex flex-col items-start gap-1.5 w-full ${className || ""}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <div className="relative w-full">
        {icon && (
          <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${error ? "text-red-400" : "text-gray-400"}`}>
            {icon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          name={name}
          id={id}
          placeholder={placeholder}
          onChange={handleChange}
          onBlur={onBlur}
          value={getInput}
          className={`w-full py-2.5 rounded-xl border text-sm transition-all duration-200 outline-none bg-white placeholder:text-gray-400 ${
            icon ? "pl-10 pr-4" : "px-4"
          } ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200"
              : "border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {children}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-red-500 text-xs flex items-center gap-1 mt-0.5" role="alert">
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

InputBox.displayName = "InputBox";

export default InputBox;
