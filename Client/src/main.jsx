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
import Report from "./pages/Employee Dashboard/Attendance_Info";
import Event from "./pages/Employee Dashboard/Event";

const routers = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: "error element not found ",
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
        path: "/attendance",
        element: (
          <ProtectedRoute role="">
            <Attendance_Info />
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
        path: "/event",
        element: (
          <ProtectedRoute role="">
            <Event />
          </ProtectedRoute>
        ),
      },

      { path: "/unauthorized", element: "unauthorized" },
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
