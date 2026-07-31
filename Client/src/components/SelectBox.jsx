const SelectBox = ({
  name,
  id,
  label,
  setInput,
  getInput,
  option = [],
}) => {
  const handleChange = (event) => {
    setInput(event.target.value);
  };
  return (
    <div className="flex flex-col items-start gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <select
        name={name}
        id={id}
        onChange={handleChange}
        value={getInput}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: "40px",
        }}>
        <option value="">---Select---</option>
        {option.map((item, i) => (
          <option key={i} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectBox;
