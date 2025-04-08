import React from "react";
import Download from "../assets/material-symbols-light_download.svg";

import { toast } from "react-toastify";

const InfoBoxCardDow = ({ tasks }) => {
  // Function to handle resume download
  const handleDownload = async (taskTitle) => {
    // console.log("Download started for:", taskTitle);
    toast.success("Download Successfull ");
    // // Example download logic:
    // const fileUrl = `${
    //   import.meta.env.VITE_BACKEND_URL
    // }/downloads/${taskTitle}.pdf`;
    // const link = document.createElement("a");
    // link.href = fileUrl;
    // link.download = `${taskTitle}.pdf`;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {tasks.map((item, index) => (
        <div
          key={index}
          className="bg-white shadow-md rounded-xl p-4 border border-gray-200 hover:shadow-lg transition duration-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {item.title}
          </h2>
          <p className="text-gray-600 mb-2">{item.desc}</p>
          <div className="flex flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              {new Date(item.datetime).toLocaleString()}
            </p>

            <button
              onClick={() => handleDownload(item.taskTitle)}
              className="flex flex-row justify-center items-center border-2 border-solid border-gray-300 p-2 rounded-lg text-base hover:bg-gray-100">
              <img
                className="md:w-7 w-4 h-auto mr-2"
                src={Download}
                alt="Download icon"
              />
              Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InfoBoxCardDow;
