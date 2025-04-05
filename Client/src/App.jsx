import { useEffect, useState } from "react";
import Navber from "./components/Navber";
import Footer from "./components/Footer";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
function App() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state?.auth);
  const [token, setToken] = useState(user?.token || "");

  console.log("user token:", token);

  useEffect(() => {
    if (!user?.token) {
      navigate("/");
    } else {
      setToken(user.token);
    }
  }, [user?.token, navigate]);

  return (
    <div className="bg-[#F1F2F6] w-full h-full">
      {!token ? (
        <>
          <ToastContainer />
          <Outlet />
        </>
      ) : (
        <>
          <Navber />
          <ToastContainer />
          <Outlet />
          <Footer />
        </>
      )}
    </div>
  );
}

export default App;
