import React, { useState } from "react";
import InputBox from "../components/InputBox";
import HoreImage from "../assets/Group 427318876.svg";
import Button from "../components/Button";
import { Link, useNavigate } from "react-router-dom";
import Heading from "../components/Heading";
import bgImage from "../assets/pexels-olly-3771790.jpg";
import axios from "axios";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { login } from "../redux/slices/authSlice";
const Login = () => {
  const [Email, setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const dispatch = useDispatch();
  const Navrouter = useNavigate();
  const fromSubmit = async (e) => {
    e.preventDefault();

    if (!Email && Password) {
      return toast.error("pls enter your email and password");
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/emp/emp-login`,
        {
          email: Email,
          password: Password,
        }
      );

      const info = {
        token: res.data.token,
        user: res.data.user,
      };
      // console.log(info);
      toast.success("Login successful");
      dispatch(login(info));
      Navrouter("/overview");
    } catch (error) {
      console.log(error);
      return toast.error(error.response.data.message);
    }

    setEmail("");
    setPassword("");
  };
  return (
    <div className="flex flex-row  ">
      <div className="lg:w-[40vw] w-full ">
        <div
          className={`flex justify-center items-center lg:h-full h-screen flex-col gap-4 px-5 bg-[#F1F2F6] `}>
          <Heading Haeding="Login" />
          <form onSubmit={fromSubmit} className="flex flex-col gap-3">
            <InputBox
              label="Email"
              key="Email"
              id="Email"
              placeholder="Enter your company email id"
              name="email"
              setInput={setEmail}
              getInput={Email}
            />
            <InputBox
              label="Password"
              key="Password"
              id="Password"
              name="Password"
              placeholder="Enter your password"
              setInput={setPassword}
              getInput={Password}
            />
            <p className="text-[#3354F4] text-right">
              <Link to="/forgotpassword">Forgot Password?</Link>
            </p>
            <div className="text-center">
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

export default Login;
