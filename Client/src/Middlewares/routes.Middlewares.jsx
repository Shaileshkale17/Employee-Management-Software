import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!user || !user.token) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (location.pathname === "/") {
    return <Navigate to="/overview" replace />;
  }

  const allowed =
    !role ||
    (Array.isArray(role) ? role : [role]).includes(user?.user?.role || user?.role);

  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
