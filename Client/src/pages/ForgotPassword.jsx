import { useState } from "react";
import InputBox from "../components/InputBox";
import HoreImage from "../assets/Group 427318876.svg";
import Button from "../components/Button";
import { Link, useNavigate } from "react-router-dom";
import Heading from "../components/Heading";
import { toast } from "react-toastify";
import { api } from "../utils/api";
import { Lock } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const err = {};
    if (!email.trim()) err.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      err.email = "Enter a valid email address";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true });
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post("/emp/forgot-password", { email: email.trim() });
      sessionStorage.setItem("mfa_email", email.trim());
      sessionStorage.setItem("otp_mode", "reset");
      navigate("/otp", { state: { mode: "reset", email: email.trim() } });
      toast.success(res.data?.message || "Reset code sent to your email");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-surface-100 overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px]"
        aria-hidden="true"
      />
      <div className="relative flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-[440px] animate-fade-in-up">
          <div className="relative card-surface p-8 shadow-popover">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent"
              aria-hidden="true"
            />
            <div className="text-center mb-7">
              <div className="relative mx-auto mb-5 w-16 h-16">
                <div className="absolute inset-0 rounded-2xl bg-brand-500/20 blur-lg" aria-hidden="true" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-sm">
                  <Lock className="h-7 w-7" />
                </div>
              </div>
              <Heading heading="Forgot Password" className="text-2xl" />
              <p className="text-ink-500 text-sm mt-1.5">
                Enter your account email and we&apos;ll send you a verification code
              </p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <InputBox
                label="Email"
                id="email"
                placeholder="Enter your registered email"
                name="email"
                type="email"
                setInput={setEmail}
                getInput={email}
                error={touched.email ? errors.email : ""}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, email: true }));
                  validate();
                }}
              />
              <Button type="submit" label="Send Reset Code" loading={loading} disabled={loading} />
              <p className="text-center text-sm text-ink-500">
                Remember your password?{" "}
                <Link to="/" className="text-brand-600 hover:text-brand-700 hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
      <div className="relative w-[55%] min-h-screen hidden lg:flex items-center justify-center overflow-hidden bg-surface-900 p-12">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] animate-float-slow" aria-hidden="true" />
        <img
          src={HoreImage}
          alt="Reset password illustration"
          className="relative z-10 max-w-md object-contain opacity-80 animate-float"
        />
      </div>
    </div>
  );
};

export default ForgotPassword;
