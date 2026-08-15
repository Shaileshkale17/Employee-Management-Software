import { useState, useEffect, useRef } from "react";
import InputBox from "../components/InputBox";
import Button from "../components/Button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { login, setPendingMfa } from "../redux/slices/authSlice";
import { api } from "../utils/api";
import { Mail, Lock, Building, Users, Calendar, ChartColumn, Eye, EyeOff, Check } from "lucide-react";

const features = [
  { icon: <Building className="w-4 h-4" />, text: "Employee Directory" },
  { icon: <Calendar className="w-4 h-4" />, text: "Meeting & Event Mgmt" },
  { icon: <Users className="w-4 h-4" />, text: "Team Collaboration" },
  { icon: <ChartColumn className="w-4 h-4" />, text: "Analytics & Reports" },
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
    <div className="relative flex min-h-screen bg-surface-100 overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-0 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[100px]"
        aria-hidden="true"
      />

      <div className="relative flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-[440px] animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-800 rounded-2xl shadow-lg shadow-brand-600/30 mb-4">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-ink-950 tracking-tight">
              Employee Management
            </h1>
            <p className="text-ink-500 text-sm mt-1">
              Sign in to your account
            </p>
          </div>

          <div className="relative card-surface p-8 shadow-popover">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent"
              aria-hidden="true"
            />
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
                icon={<Mail className="h-5 w-5" />}
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
                icon={<Lock className="h-5 w-5" />}
                error={touched.password ? errors.password : ""}
                onBlur={() => handleBlur("password")}
              >
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition-colors rounded-md p-1 focus-ring"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </InputBox>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    defaultChecked
                  />
                  <span
                    aria-hidden="true"
                    className="flex h-[18px] w-[18px] items-center justify-center rounded-md border border-ink-300 bg-white transition-all duration-200 group-hover:border-brand-400 peer-checked:border-brand-600 peer-checked:bg-brand-600 dark:border-ink-600"
                  >
                    <Check className="h-3 w-3 text-white" strokeWidth={3.5} />
                  </span>
                  <span className="text-ink-500 group-hover:text-ink-700 transition-colors">
                    Remember me
                  </span>
                </label>
                <Link
                  to="/forgotpassword"
                  className="text-brand-600 hover:text-brand-700 hover:underline transition-all font-medium"
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

              <p className="text-center text-sm text-ink-500 mt-2">
                New here?{" "}
                <Link
                  to="/register-company"
                  className="text-brand-600 hover:text-brand-700 hover:underline font-medium transition-colors"
                >
                  Register your company
                </Link>
              </p>
            </form>
          </div>

          <p className="text-center text-xs text-ink-400 mt-6">
            Secured by JWT authentication &amp; multi-factor verification
          </p>
        </div>
      </div>

      <div className="relative w-[55%] min-h-screen hidden lg:flex flex-col overflow-hidden bg-surface-900 p-12">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] animate-float-slow" aria-hidden="true" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[100px]" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-500/5 rounded-full blur-[80px]" aria-hidden="true" />

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
              <span className="text-gray-300 text-xs font-medium tracking-wide uppercase">
                Enterprise Platform
              </span>
            </div>

            <h2 className="text-4xl font-bold text-white tracking-tight leading-[1.15] mb-4">
              Streamline Your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-200">
                Workforce Management
              </span>
            </h2>

            <p className="text-gray-400 text-[15px] leading-relaxed mb-10 max-w-md mx-auto">
              A comprehensive solution designed for modern enterprises to manage
              employees, tasks, meetings, and company assets effortlessly.
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3.5 transition-all duration-300 hover:bg-white/[0.07] hover:border-white/[0.12]">
                  <div className="w-9 h-9 rounded-lg bg-brand-500/15 text-brand-300 flex items-center justify-center flex-shrink-0">
                    {feature.icon}
                  </div>
                  <span className="text-sm text-gray-300 font-medium">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center">
          <p className="text-gray-400 text-xs">
            &copy; {new Date().getFullYear()} Employee Management System. All
            rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
