import React from "react";

const TextArea = ({ name, id, label, placeholder, value, onChange }) => {
  return (
    <div className="flex flex-col flex-wrap items-start gap-2">
      <label htmlFor={id} className="font-montserrat text-lg">
        {label}
      </label>
      <textarea
        name={name}
        id={id}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        className="border border-solid border-[#3354F4] md:w-[94vh] w-64 p-2 rounded-md"
        cols="5"
      />
    </div>
  );
};

export default TextArea;
