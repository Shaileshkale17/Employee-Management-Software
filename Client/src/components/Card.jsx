import React from "react";

const Card = ({ children }) => (
  <div className="text-center flex justify-center items-center rounded-lg shadow-md p-4">
    {children}
  </div>
);

export default Card;
