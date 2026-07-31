const TextArea = ({ name, id, label, placeholder, value, onChange, rows = 5 }) => {
  return (
    <div className="flex flex-col items-start gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-gray-700">
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
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 placeholder:text-gray-400 resize-none"
      />
    </div>
  );
};

export default TextArea;
