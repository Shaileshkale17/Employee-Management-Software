import { useEffect } from "react";
import Navber from "./components/Navber";
import Footer from "./components/Footer";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state?.auth);
  useEffect(() => {
    if (!user?.token) {
      navigate("/");
    }
  }, [user?.token, navigate]);

  return (
    <div className="bg-[#F1F2F6] w-full h-full min-h-screen">
      {user?.token && <Navber />}
      {/* Always shown */}
      <ToastContainer />
      <Outlet />
      {user?.token && <Footer />}
    </div>
  );
}

export default App;
