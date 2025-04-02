import { useEffect, useState } from "react";
import Navber from "./components/Navber";
import Footer from "./components/Footer";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const NavberRouter = useNavigate();
  const { user } = useSelector((state) => state.auth);
  console.log("user", user);
  useEffect(() => {
    localStorage.setItem("token", "");
    if (token === "") {
      NavberRouter("/");
    }
  }, [setToken]);

  return (
    <div className="bg-[#F1F2F6] w-full h-full">
      {token === "" ? (
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
