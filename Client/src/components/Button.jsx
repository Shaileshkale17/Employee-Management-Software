import React from "react";

const Button = ({ label, type }) => {
  return (
    <button
      type={type}
      className="bg-[#3354F4] border border-solid border-[#3354F4] px-4 py-2 rounded-md text-white font-montserrat font-bold text-lg leading-relaxed tracking-tightest">
      {label}
    </button>
  );
};

export default Button;
