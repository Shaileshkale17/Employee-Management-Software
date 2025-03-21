import React, { useEffect, useState } from "react";

import HoreImage from "../assets/Group 427318876.svg";
import Button from "../components/Button";
import { Link, useNavigate } from "react-router-dom";
import Heading from "../components/Heading";
import OTPBox from "../components/OTPBox";
import CheckBox from "../components/CheckBox";

const OTP = () => {
  const [otp, setOtps] = useState(Array(4).fill(""));
  const [selectedCheckbox, setSelectedCheckbox] = useState(null);
  const [time, setTime] = useState(600); // 600 seconds = 10 minutes

  const navigate = useNavigate();

  useEffect(() => {
    if (time > 0) {
      const timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearInterval(timer); // Cleanup on component unmount or when time changes
    }
  }, [time]);

  // Convert the time to minutes and seconds format
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleCheckboxChange = (name) => () => {
    setSelectedCheckbox(name);
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtps(newOtp);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle OTP validation and form submission here
    navigate("/overview");
  };

  return (
    <div className="flex flex-row">
      <div className="lg:w-[40vw] w-full">
        <div
          className={`flex justify-center items-center lg:h-full h-screen flex-col gap-4 px-5 bg-[#F1F2F6] `}>
          <Heading Haeding="Verification" />
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <p>Enter Your OTP</p>
            <div className="flex flex-row gap-3">
              {otp.map((value, index) => (
                <OTPBox
                  key={index}
                  index={index}
                  otp={otp}
                  setOtp={handleOtpChange}
                />
              ))}
            </div>
            <p className="text-right">
              {time > 0 ? (
                <span className="text-[#ff000083]">{formatTime(time)}</span>
              ) : (
                <span
                  className="text-[#3354F4] cursor-pointer"
                  onClick={setTime(600)}>
                  Resend OTP
                </span>
              )}
            </p>

            {/* Include the CheckBox components */}
            <div className="mb-4 flex flex-col flex-wrap gap-2">
              <p>Your location</p>
              <div className="flex flex-row  items-center justify-center gap-2">
                <CheckBox
                  label="Office"
                  checked={selectedCheckbox === "office"}
                  onChange={handleCheckboxChange("office")}
                />
                <CheckBox
                  label="Remote"
                  checked={selectedCheckbox === "Remote"}
                  onChange={handleCheckboxChange("Remote")}
                />
                <CheckBox
                  label="Client"
                  checked={selectedCheckbox === "Client"}
                  onChange={handleCheckboxChange("Client")}
                />
              </div>
            </div>

            <div className="text-center">
              <Button type="submit" label="Submit" />
            </div>
          </form>
        </div>
      </div>
      <div className="w-full h-[100vh] hidden lg:block">
        <img
          src={HoreImage}
          alt={"not found image"}
          className="lg:w-[168vh] w-[150vh] h-full object-cover"
        />
      </div>
    </div>
  );
};

export default OTP;
