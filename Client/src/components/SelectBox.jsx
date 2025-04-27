import React from "react";

const SelectBox = ({
  name,
  id,
  label,
  setInput,
  getInput,
  placeholder,
  option = [],
}) => {
  const handleChange = (event) => {
    setInput(event.target.value); // Use the passed setInput function
  };
  return (
    <div className="flex flex-col flex-wrap items-start gap-2">
      <label htmlFor={id} className="font-montserrat text-lg">
        {label}
      </label>
      <select
        name={name}
        id={id}
        placeholder={placeholder}
        onChange={handleChange}
        value={getInput}
        className="border border-solid border-[#3354F4] md:w-80 w-64 p-2 rounded-md">
        <option>---Select---</option>
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
