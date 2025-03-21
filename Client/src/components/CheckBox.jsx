import React from "react";

const CheckBox = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className="form-checkbox h-5 w-5 text-blue-600 rounded-full appearance-none border border-solid border-blue-600  checked:bg-blue-600 checked:border-transparent" // Added `rounded-full` to make it circular
        checked={checked}
        onChange={onChange}
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
};

export default CheckBox;
