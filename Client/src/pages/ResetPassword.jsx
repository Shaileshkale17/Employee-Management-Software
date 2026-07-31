import { useState } from "react";
import InputBox from "../components/InputBox";
import HoreImage from "../assets/Group 427318876.svg";
import Button from "../components/Button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Heading from "../components/Heading";
import { toast } from "react-toastify";
import { api } from "../utils/api";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = location.state?.resetToken || "";

  const validate = () => {
    const err = {};
    if (!newPassword) err.newPassword = "Password is required";
    else if (newPassword.length < 6)
      err.newPassword = "Password must be at least 6 characters";
    if (!confirmPassword) err.confirmPassword = "Please confirm your password";
    else if (confirmPassword !== newPassword)
      err.confirmPassword = "Passwords do not match";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ newPassword: true, confirmPassword: true });
    if (!resetToken) {
      toast.error("Reset session expired. Please start again.");
      navigate("/forgotpassword", { replace: true });
      return;
    }
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post("/emp/reset-password", {
        resetToken,
        newPassword,
        confirmPassword,
      });
      sessionStorage.removeItem("mfa_email");
      sessionStorage.removeItem("otp_mode");
      toast.success("Password reset successfully. Please sign in.");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password.");
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
              <Heading heading="Reset Password" className="text-2xl" />
              <p className="text-gray-500 text-sm mt-1">Enter your new password</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <InputBox
                label="New Password"
                id="newPassword"
                placeholder="Enter your new password"
                name="newPassword"
                type="password"
                setInput={setNewPassword}
                getInput={newPassword}
                error={touched.newPassword ? errors.newPassword : ""}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, newPassword: true }));
                  validate();
                }}
              />
              <InputBox
                label="Confirm Password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your new password"
                type="password"
                setInput={setConfirmPassword}
                getInput={confirmPassword}
                error={touched.confirmPassword ? errors.confirmPassword : ""}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, confirmPassword: true }));
                  validate();
                }}
              />
              <Button type="submit" label="Reset Password" loading={loading} disabled={loading} />
              <p className="text-center text-sm text-gray-500">
                Remember your password?{" "}
                <Link to="/" className="text-brand-600 hover:text-brand-700 hover:underline font-medium">
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
          alt="Reset password illustration"
          className="relative z-10 max-w-md object-contain opacity-80"
        />
      </div>
    </div>
  );
};

export default ResetPassword;
