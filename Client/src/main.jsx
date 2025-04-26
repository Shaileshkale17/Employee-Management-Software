import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login";
import OTP from "./pages/OTP";
import ForgotPassword from "./pages/ForgotPassword";
import Overview from "./pages/Overview";
import { Provider } from "react-redux";
import store from "./redux/store";
import Text from "./pages/text";
import ProtectedRoute from "./Middlewares/routes.Middlewares";
import Task from "./pages/Task";
import Message from "./pages/Message";
import Meeting from "./pages/Meeting";
import Attendance_Info from "./pages/Attendance_Info";
import Report from "./pages/Report";
import Event from "./pages/Event";
import EmployeeRegistration from "./pages/EmployeeRegistration";
import SearchBarInAll from "./components/scarchBerInAll";
import Unauthorized from "./components/unauthorized";
import Job_Postings from "./pages/Job_Postings";
import InterviewSchedulingCoordination from "./pages/InterviewSchedulingCoordination";
import ResumeScreening from "./pages/ResumeScreening";
import ConductingInterviews from "./pages/ConductingInterviews";

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
      {
        path: "/job-postings",
        element: (
          <ProtectedRoute role="">
            <Job_Postings />
          </ProtectedRoute>
        ),
      },
      {
        path: "/resume-screening",
        element: (
          <ProtectedRoute role="">
            <ResumeScreening />
          </ProtectedRoute>
        ),
      },
      {
        path: "/interview-scheduling-coordination",
        element: (
          <ProtectedRoute role="">
            <InterviewSchedulingCoordination />
          </ProtectedRoute>
        ),
      },
      {
        path: "/JobPostings",
        element: (
          <ProtectedRoute role="">
            <InterviewSchedulingCoordination />
          </ProtectedRoute>
        ),
      },
      {
        path: "/conducting-interviews",
        element: (
          <ProtectedRoute role="">
            <ConductingInterviews />
          </ProtectedRoute>
        ),
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
