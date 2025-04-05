import React from "react";
import { Link } from "react-router-dom";

const Title_Card = ({ icon, title, description, link, status }) => {
  const isComingSoon = status === "coming_soon";
  const Wrapper = link && !isComingSoon ? Link : "div";

  return (
    <Wrapper
      to={link}
      className={`relative flex flex-col items-center text-center p-4 bg-white shadow-md rounded-lg transition-all hover:shadow-lg ${
        isComingSoon ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}>
      <img src={icon} alt={title} className="w-12 h-12 mb-2" />
      <h5 className="font-semibold text-lg">{title}</h5>
      {/* <p className="text-sm text-gray-500 mt-1">{description}</p> */}
      {isComingSoon && (
        <span className="absolute top-0 right-0 text-xs px-2 py-1 bg-yellow-400 text-white rounded-full">
          Coming Soon
        </span>
      )}
    </Wrapper>
  );
};

export default Title_Card;
