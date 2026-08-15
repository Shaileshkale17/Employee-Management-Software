import { forwardRef } from "react";
import { CircleAlert } from "lucide-react";

const InputBox = forwardRef(
  (
    {
      name,
      type = "text",
      id,
      label,
      ariaLabel,
      setInput,
      getInput,
      placeholder,
      icon,
      error,
      onBlur,
      onKeyDown,
      children,
      className,
      hint,
    },
    ref,
  ) => {
    const handleChange = (event) => {
      setInput(event.target.value);
    };
    return (
      <div className={`flex flex-col items-start gap-1.5 w-full ${className || ""}`}>
        {label && (
          <label htmlFor={id} className="text-[13px] font-semibold text-ink-800">
            {label}
          </label>
        )}
        <div className="relative w-full">
          {icon && (
            <span
              className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                error ? "text-red-400" : "text-ink-400"
              }`}
              aria-hidden="true">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            type={type}
            name={name}
            id={id}
            aria-label={ariaLabel}
            placeholder={placeholder}
            onChange={handleChange}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            value={getInput}
            className={`${icon ? "pl-10 pr-3" : "p-3"} ${
              error
                ? "!border-red-300 focus:!border-red-400 focus:!ring-4 focus:!ring-red-500/10"
                : ""
            } input-base`}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          />
          {children}
        </div>
        {hint && !error && (
          <p id={`${id}-hint`} className="text-xs text-ink-400 mt-0.5">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className="text-red-500 text-xs flex items-center gap-1 mt-0.5" role="alert">
            <CircleAlert className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  },
);

InputBox.displayName = "InputBox";

export default InputBox;
