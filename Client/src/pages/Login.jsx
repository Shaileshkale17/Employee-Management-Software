import { useState, useEffect, useRef } from "react";
import InputBox from "../components/InputBox";
import Button from "../components/Button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { login, setPendingMfa } from "../redux/slices/authSlice";
import { api } from "../utils/api";

const EmailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 4L12 13 2 4" />
  </svg>
);

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const EyeIcon = ({ visible }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {visible ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const BuildingIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4 text-[#3354F4]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
);

const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4 text-[#3354F4]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4 text-[#3354F4]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ChartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4 text-[#3354F4]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const features = [
  { icon: <BuildingIcon />, text: "Employee Directory" },
  { icon: <CalendarIcon />, text: "Meeting & Event Mgmt" },
  { icon: <UsersIcon />, text: "Team Collaboration" },
  { icon: <ChartIcon />, text: "Analytics & Reports" },
];

const Login = () => {
  const [Email, setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const emailRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const validate = (field) => {
    const err = { ...errors };
    if (!field || field === "email") {
      if (!Email.trim()) err.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email))
        err.email = "Enter a valid email address";
      else delete err.email;
    }
    if (!field || field === "password") {
      if (!Password) err.password = "Password is required";
      else if (Password.length < 6)
        err.password = "Password must be at least 6 characters";
      else delete err.password;
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate(field);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await api.post("/emp/emp-login", {
        email: Email.trim(),
        password: Password,
      });

      if (res.data.mfaRequired) {
        sessionStorage.setItem("mfa_userId", res.data.userId);
        sessionStorage.setItem("mfa_email", Email.trim());
        dispatch(setPendingMfa(true));
        toast.info("Enter the verification code sent to your email");
        navigate("/otp", { state: { mode: "mfa" } });
        return;
      }

      const info = { token: res.data.token, user: res.data.user };
      toast.success("Welcome back!");
      dispatch(login(info));
      navigate("/overview");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#F1F2F6] via-[#F8F9FF] to-[#E8EAF6]">
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-[440px] animate-fadeIn">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#3354F4] to-[#1a3bb8] rounded-2xl shadow-lg shadow-[#3354F4]/20 mb-4">
              <svg
                className="w-7 h-7 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-montserrat tracking-tight">
              Employee Management
            </h1>
            <p className="text-gray-500 text-sm font-montserrat mt-1">
              Sign in to your account
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/70 border border-gray-100 p-8">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
              noValidate
            >
              <InputBox
                label="Email"
                id="Email"
                placeholder="Enter your company email"
                name="email"
                setInput={setEmail}
                getInput={Email}
                icon={<EmailIcon />}
                error={touched.email ? errors.email : ""}
                onBlur={() => handleBlur("email")}
                ref={emailRef}
              />
              <InputBox
                label="Password"
                id="Password"
                name="password"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                setInput={setPassword}
                getInput={Password}
                icon={<LockIcon />}
                error={touched.password ? errors.password : ""}
                onBlur={() => handleBlur("password")}
              >
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </InputBox>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[#3354F4] focus:ring-[#3354F4]/50 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="font-montserrat text-gray-500 group-hover:text-gray-700 transition-colors">
                    Remember me
                  </span>
                </label>
                <Link
                  to="/forgotpassword"
                  className="font-montserrat text-[#3354F4] hover:text-[#2a45d4] hover:underline transition-all font-medium"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                label="Sign In"
                loading={loading}
                disabled={loading}
              />

              <p className="text-center font-montserrat text-sm text-gray-500 mt-2">
                New here?{" "}
                <Link
                  to="/register-company"
                  className="text-[#3354F4] hover:text-[#2a45d4] hover:underline font-medium transition-colors"
                >
                  Register your company
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <div className="w-[55%] min-h-screen hidden lg:flex flex-col relative overflow-hidden bg-gradient-to-br from-[#1A2340] via-[#131A2E] to-[#0B0F1C] p-12">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#3354F4]/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-[#4B6BFF]/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#3354F4]/5 rounded-full blur-[80px]" />

        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center flex-1">
          <div className="max-w-lg text-center">
            <div className="inline-flex items-center gap-2 bg-white/[0.08] border border-white/[0.12] rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-gray-300 text-xs font-montserrat font-medium tracking-wide uppercase">
                Enterprise Platform
              </span>
            </div>

            <h2 className="text-4xl font-bold text-white font-montserrat tracking-tight leading-[1.15] mb-4">
              Streamline Your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B6BFF] to-[#8BA3FF]">
                Workforce Management
              </span>
            </h2>

            <p className="text-gray-400 font-montserrat text-[15px] leading-relaxed mb-10 max-w-md mx-auto">
              A comprehensive solution designed for modern enterprises to manage
              employees, tasks, meetings, and company assets effortlessly.
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3.5"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#3354F4]/15 flex items-center justify-center flex-shrink-0">
                    {feature.icon}
                  </div>
                  <span className="text-sm text-gray-300 font-montserrat font-medium">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center">
          <p className="text-gray-600 text-xs font-montserrat">
            &copy; {new Date().getFullYear()} Employee Management System. All
            rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
