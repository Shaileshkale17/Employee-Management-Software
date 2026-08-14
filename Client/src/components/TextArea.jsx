import { CircleAlert } from "lucide-react";

const TextArea = ({ name, id, label, placeholder, value, onChange, rows = 5, error, className }) => {
  return (
    <div className={`flex flex-col items-start gap-1.5 w-full ${className || ""}`}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-semibold text-ink-800">
          {label}
        </label>
      )}
      <textarea
        name={name}
        id={id}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        rows={rows}
        className={`input-base resize-none leading-relaxed ${
          error ? "!border-red-300 focus:!ring-red-500/10" : ""
        }`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="text-red-500 text-xs flex items-center gap-1 mt-0.5" role="alert">
          <CircleAlert className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

export default TextArea;
