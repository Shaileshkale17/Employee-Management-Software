import { useEffect, useState } from "react";
import HoreImage from "../assets/Group 427318876.svg";
import Button from "../components/Button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Heading from "../components/Heading";
import OTPBox from "../components/OTPBox";
import CheckBox from "../components/CheckBox";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { login, setPendingMfa } from "../redux/slices/authSlice";
import { api } from "../utils/api";

const OTP = () => {
  const [otp, setOtps] = useState(Array(6).fill(""));
  const [selectedCheckbox, setSelectedCheckbox] = useState(null);
  const [time, setTime] = useState(600);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const mode = location.state?.mode || sessionStorage.getItem("otp_mode") || "mfa";
  const email = location.state?.email || sessionStorage.getItem("mfa_email") || "";
  const userId = sessionStorage.getItem("mfa_userId") || "";

  useEffect(() => {
    sessionStorage.setItem("otp_mode", mode);
    if (mode === "mfa" && !sessionStorage.getItem("mfa_userId")) {
      navigate("/", { replace: true });
    }
    if (mode === "reset" && !email) {
      navigate("/forgotpassword", { replace: true });
    }
  }, [mode, email, navigate]);

  useEffect(() => {
    if (time > 0) {
      const timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [time]);

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

  const resendCode = async () => {
    setTime(600);
    try {
      if (mode === "reset") {
        await api.post("/emp/forgot-password", { email });
        toast.success("A new code has been sent to your email");
      } else {
        sessionStorage.removeItem("mfa_userId");
        sessionStorage.removeItem("mfa_email");
        sessionStorage.removeItem("otp_mode");
        dispatch(setPendingMfa(false));
        toast.info("Please sign in again to request a new code");
        navigate("/", { replace: true });
      }
    } catch {
      toast.error("Unable to resend the code. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    setLoading(true);
    try {
      if (mode === "reset") {
        const res = await api.post("/emp/verify-otp", { email, otp: code });
        sessionStorage.removeItem("otp_mode");
        navigate("/reset-password", {
          state: { resetToken: res.data.data.resetToken },
        });
      } else {
        if (!userId) {
          toast.error("Session expired. Please sign in again.");
          navigate("/", { replace: true });
          return;
        }
        const res = await api.post("/emp/verify-mfa", { userId, otp: code });
        sessionStorage.removeItem("mfa_userId");
        sessionStorage.removeItem("mfa_email");
        sessionStorage.removeItem("otp_mode");

        if (selectedCheckbox) {
          api.put("/emp/profile", { workLocation: selectedCheckbox }).catch(() => {});
        }

        dispatch(login({ token: res.data.token, user: res.data.user }));
        toast.success("Verification successful!");
        navigate("/overview");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-surface-100 via-surface-50 to-surface-200">
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-[440px] animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-6">
              <Heading heading="Verification" className="text-2xl" />
              <p className="text-gray-500 text-sm mt-1">
                {mode === "reset"
                  ? "Enter the 6-digit code sent to your email"
                  : "Enter the 6-digit code sent to your email"}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Enter Your OTP</p>
                <div className="flex justify-center gap-2.5">
                  {otp.map((value, index) => (
                    <OTPBox
                      key={index}
                      index={index}
                      otp={otp}
                      setOtp={handleOtpChange}
                    />
                  ))}
                </div>
                <p className="text-right mt-3 text-sm">
                  {time > 0 ? (
                    <span className="text-red-400 font-medium">{formatTime(time)}</span>
                  ) : (
                    <button
                      type="button"
                      className="text-brand-600 hover:text-brand-700 font-medium cursor-pointer"
                      onClick={resendCode}
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </div>

              {mode === "mfa" && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Your location</p>
                  <div className="flex gap-4">
                    <CheckBox
                      label="Office"
                      checked={selectedCheckbox === "Office"}
                      onChange={handleCheckboxChange("Office")}
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
              )}

              <Button type="submit" label="Verify OTP" loading={loading} disabled={loading} />
              <p className="text-center text-sm text-gray-500">
                Back to{" "}
                <Link
                  to="/"
                  onClick={() => {
                    sessionStorage.removeItem("mfa_userId");
                    sessionStorage.removeItem("mfa_email");
                    sessionStorage.removeItem("otp_mode");
                    dispatch(setPendingMfa(false));
                  }}
                  className="text-brand-600 hover:text-brand-700 hover:underline font-medium"
                >
                  Sign In
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
      <div className="w-[55%] min-h-screen hidden lg:flex items-center justify-center bg-gradient-to-br from-surface-900 via-[#131A2E] to-[#0B0F1C] p-12 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px]" />
        <img
          src={HoreImage}
          alt="Verification illustration"
          className="relative z-10 max-w-md object-contain opacity-80"
        />
      </div>
    </div>
  );
};

export default OTP;
