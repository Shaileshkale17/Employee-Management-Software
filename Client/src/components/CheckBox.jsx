import { Check } from "lucide-react";

const CheckBox = ({ label, checked, onChange, className }) => {
  return (
    <label className={`flex items-center gap-2.5 cursor-pointer group ${className || ""}`}>
      <span className="relative inline-flex">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={onChange}
        />
        <span
          aria-hidden="true"
          className="w-[18px] h-[18px] rounded-md border transition-all duration-200 ease-smooth
            bg-white border-ink-300 group-hover:border-brand-400 dark:border-ink-600
            peer-checked:bg-brand-600 peer-checked:border-brand-600
            peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/40 peer-focus-visible:ring-offset-1
            flex items-center justify-center">
          <Check
            className={`w-3 h-3 text-white transition-all duration-200 ${
              checked ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
            strokeWidth={3.5}
          />
        </span>
      </span>
      <span className="text-sm text-ink-700 group-hover:text-ink-900 transition-colors">{label}</span>
    </label>
  );
};

export default CheckBox;
