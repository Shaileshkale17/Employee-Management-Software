import React from "react";

const InputBox = ({
  name,
  type = "Text",
  id,
  label,
  setInput,
  getInput,
  placeholder,
}) => {
  const handleChange = (event) => {
    setInput(event.target.value); // Use the passed setInput function
  };
  return (
    <div className="flex flex-col flex-wrap items-start gap-2">
      <label htmlFor={id} className="font-montserrat text-lg">
        {label}
      </label>
      <input
        type={type}
        name={name}
        id={id}
        placeholder={placeholder}
        onChange={handleChange}
        value={getInput}
        className="border border-solid border-[#3354F4] md:w-80 w-64 p-2 rounded-md"
      />
    </div>
  );
};

export default InputBox;
