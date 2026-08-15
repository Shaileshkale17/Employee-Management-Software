const SelectBox = ({ name, id, label, ariaLabel, setInput, getInput, option = [], placeholder, className }) => {
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
        <select
          name={name}
          id={id}
          aria-label={ariaLabel}
          onChange={handleChange}
          value={getInput}
          className="input-base appearance-none cursor-pointer pr-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a94a6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 14px center",
          }}>
          <option value="">{placeholder || "---Select---"}</option>
          {option.map((item, i) => (
            <option key={i} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SelectBox;
