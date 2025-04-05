import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!user || !user.token) {
    return <Navigate to="/" replace />;
  }

  if (location.pathname === "/") {
    return <Navigate to="/overview" replace />;
  }

  //   const userRole = user?.user?.role || user?.data?.role;
  //   if (role && userRole !== role) {
  //     return <Navigate to="/unauthorized" replace />;
  //   }

  return children;
};

export default ProtectedRoute;
