import React from "react";
import { Link } from "react-router-dom";
const Footer = () => {
  return (
    <div className="h-10 flex justify-center items-center text-center bg-white  border border-solid border-[#3354F4] shadow-lg drop-shadow-lg ">
      All Copyright Reserved By ©{}{" "}
      <Link
        to="https://protfolio-shailesh-full-stack-developer.vercel.app/"
        className="cursor-pointer">
        Shailesh Kale
      </Link>
    </div>
  );
};

export default Footer;
