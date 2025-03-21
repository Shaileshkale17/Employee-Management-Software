import { useEffect, useState } from "react";

import InputBox from "./components/InputBox";
import Navber from "./components/Navber";
import Footer from "./components/Footer";
import { Outlet, useNavigate } from "react-router-dom";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const NavberRouter = useNavigate();

  useEffect(() => {
    localStorage.setItem("token", "CZSBFGLKJSHFLKJSHDFJDSBQVQYJKo");
    if (token === "") {
      NavberRouter("/");
    }
  }, [setToken]);

  return (
    <div className="bg-[#F1F2F6] w-full h-full">
      {token === "" ? (
        <Outlet />
      ) : (
        <>
          <Navber />
          <Outlet />
          <Footer />
        </>
      )}
    </div>
  );
}

export default App;
