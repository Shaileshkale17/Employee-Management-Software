import { useEffect } from "react";
import Navber from "./components/Navber";
import Footer from "./components/Footer";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import { logout } from "./redux/slices/authSlice";
import "react-toastify/dist/ReactToastify.css";

const PUBLIC_PATHS = [
  "/careers",
  "/register-company",
  "/verify-company-email",
  "/forgotpassword",
  "/otp",
  "/reset-password",
  "/unauthorized",
  "/join",
];

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state?.auth);
  const { mode } = useSelector((state) => state?.theme);

  useEffect(() => {
    const handleAuthExpired = () => {
      dispatch(logout());
      navigate("/");
    };
    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, [dispatch, navigate]);

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some(
      (p) => location.pathname === p || location.pathname.startsWith(`${p}/`),
    );
    if (!user?.token && !isPublic) {
      navigate("/");
    }
  }, [user?.token, navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-surface-100">
      {user?.token && <Navber />}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={mode === "dark" ? "dark" : "light"}
      />
      <Outlet />
      {user?.token && <Footer />}
    </div>
  );
}

export default App;
