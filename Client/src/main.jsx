import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login";
import OTP from "./pages/OTP";
import ForgotPassword from "./pages/ForgotPassword";
import Overview from "./pages/Employee Dashboard/Overview";
import { Provider } from "react-redux";
import store from "./redux/store";
import Text from "./pages/text";
import ProtectedRoute from "./Middlewares/routes.Middlewares";
import Task from "./pages/Employee Dashboard/Task";
import Message from "./pages/Employee Dashboard/Message";
import Meeting from "./pages/Employee Dashboard/Meeting";
import Attendance_Info from "./pages/Employee Dashboard/Attendance_Info";
import Report from "./pages/Employee Dashboard/Report";
import Event from "./pages/Employee Dashboard/Event";
import EmployeeRegistration from "./pages/Employee Dashboard/EmployeeRegistration";
import SearchBarInAll from "./components/scarchBerInAll";
import { Unauthorized } from "./components/unauthorized";

const routers = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    HydrateFallback: true,
    children: [
      { path: "/", element: <Login /> },
      {
        path: "/otp",
        element: <OTP />,
      },
      {
        path: "/forgotpassword",
        element: <ForgotPassword />,
      },
      {
        path: "/overview",
        element: (
          <ProtectedRoute role="">
            <Overview />
          </ProtectedRoute>
        ),
      },
      {
        path: "/task",
        element: (
          <ProtectedRoute role="">
            <Task />
          </ProtectedRoute>
        ),
      },
      {
        path: "/message",
        element: (
          <ProtectedRoute role="">
            <Message />
          </ProtectedRoute>
        ),
      },
      {
        path: "/meeting",
        element: (
          <ProtectedRoute role="">
            <Meeting />
          </ProtectedRoute>
        ),
      },
      {
        path: "/report",
        element: (
          <ProtectedRoute role="">
            <Report />
          </ProtectedRoute>
        ),
      },
      {
        path: "/attendance",
        element: (
          <ProtectedRoute role="">
            <Attendance_Info />
          </ProtectedRoute>
        ),
      },

      {
        path: "/event",
        element: (
          <ProtectedRoute role="">
            <Event />
          </ProtectedRoute>
        ),
      },
      {
        path: "/search",
        element: (
          <ProtectedRoute role="">
            <SearchBarInAll />
          </ProtectedRoute>
        ),
      },
      {
        path: "/EmployeeRegistration",
        element: <EmployeeRegistration />,
      },

      { path: "/unauthorized", element: <Unauthorized /> },
      { path: "/*", element: "Error Page" },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={routers} />
    </Provider>
  </StrictMode>
);
