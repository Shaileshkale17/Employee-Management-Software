import React, { useState } from "react";
import InputBox from "../components/InputBox";
import HoreImage from "../assets/Group 427318876.svg";
import Button from "../components/Button";
import { Link, useNavigate } from "react-router-dom";
import Heading from "../components/Heading";
import bgImage from "../assets/pexels-olly-3771790.jpg";
const ForgotPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [ConfirmPassword, setConfirmPassword] = useState("");
  const Navrouter = useNavigate();
  const fromSubmit = (e) => {
    e.preventDefault();
    console.log(`fromSubmit email ${Email} Password ${Password}`);
    setEmail("");
    setPassword("");
    Navrouter("/otp");
  };
  return (
    <div className="flex flex-row  ">
      <div className="lg:w-[40vw] w-full ">
        <div
          className={`flex justify-center items-center lg:h-full h-screen flex-col gap-4 px-5 bg-[#F1F2F6] `}>
          <Heading Haeding="Login" />
          <form onSubmit={fromSubmit} className="flex flex-col gap-3">
            <InputBox
              label="Enter New Password"
              key="ForgotPassword"
              id="newPassword"
              placeholder="Enter your New Password"
              name="newPassword"
              setInput={setNewPassword}
              getInput={newPassword}
            />
            <InputBox
              label="Confirm Password"
              key="ConfirmPassword"
              id="ConfirmPassword"
              name="ConfirmPassword"
              placeholder="Enter Your Confirm Password"
              setInput={setConfirmPassword}
              getInput={ConfirmPassword}
            />

            <div className="text-center mt-4">
              <Button type="submit" label="Submit" />
            </div>
          </form>
        </div>
      </div>
      <div className="w-full h-[100vh] hidden lg:block">
        <img
          src={HoreImage}
          alt={"not fonud image"}
          className="lg:w-[168vh] w-[150vh] h-full object-cover"
        />
      </div>
    </div>
  );
};

export default ForgotPassword;
