import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login";
import OTP from "./pages/OTP";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Overview from "./pages/Overview";
import { Provider } from "react-redux";
import store from "./redux/store";
import ProtectedRoute from "./Middlewares/routes.Middlewares";
import { ADMIN_ROLES } from "./Middlewares/roles";
import Task from "./pages/Task";
import Message from "./pages/Message";
import Meeting from "./pages/Meeting";
import MeetingRoom from "./pages/MeetingRoom";
import GuestJoin from "./pages/GuestJoin";
import Attendance_Info from "./pages/Attendance_Info";
import SmartCheckIn from "./pages/SmartCheckIn";
import Leaves from "./pages/Leaves";
import Report from "./pages/Report";
import Event from "./pages/Event";
import EmployeeRegistration from "./pages/EmployeeRegistration";
import SearchBarInAll from "./components/scarchBerInAll";
import Unauthorized from "./components/unauthorized";
import Job_Postings from "./pages/Job_Postings";
import InterviewSchedulingCoordination from "./pages/InterviewSchedulingCoordination";
import ResumeScreening from "./pages/ResumeScreening";
import ConductingInterviews from "./pages/ConductingInterviews";
import Job_post_form from "./pages/Job_post_form";
import NewEmployeeOrientation from "./pages/NewEmployeeOrientation";
import DocumentVerification from "./pages/DocumentVerification";
import SystemAccessSetup from "./pages/SystemAccessSetup";
import WelcomeKits from "./pages/WelcomeKits";
import CompanyRegistration from "./pages/CompanyRegistration";
import VerifyCompanyEmail from "./pages/VerifyCompanyEmail";
import Careers from "./pages/Careers";
import CareerJobDetail from "./pages/CareerJobDetail";
import CareerApply from "./pages/CareerApply";
import ApplicationSuccess from "./pages/ApplicationSuccess";
import ATS from "./pages/ATS";
import CandidateDetail from "./pages/CandidateDetail";
import CandidateEdit from "./pages/CandidateEdit";
import Interviews from "./pages/Interviews";
import Notifications from "./pages/Notifications";
import CompanySettings from "./pages/CompanySettings";
import Calendar from "./pages/Calendar";
import MaintainingEmployeeFiles from "./pages/MaintainingEmployeeFiles";
import KeepingRecordsUpdated from "./pages/KeepingRecordsUpdated";
import HandlingConfidentialInformation from "./pages/HandlingConfidentialInformation";
import ManagingSalariesBonuses from "./pages/ManagingSalariesBonuses";
import CoordinatingWithFinance from "./pages/CoordinatingWithFinance";
import AttendanceLeaveTracking from "./pages/AttendanceLeaveTracking";
import HealthInsurance from "./pages/HealthInsurance";
import ProvidentFundGratuity from "./pages/ProvidentFundGratuity";
import OtherPerksReimbursements from "./pages/OtherPerksReimbursements";
import AppraisalProcesses from "./pages/AppraisalProcesses";
import GoalSetting from "./pages/GoalSetting";
import FeedbackCollection from "./pages/FeedbackCollection";
import PromotionsTerminations from "./pages/PromotionsTerminations";

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
        path: "/reset-password",
        element: <ResetPassword />,
      },
      { path: "/register-company", element: <CompanyRegistration /> },
      { path: "/verify-company-email", element: <VerifyCompanyEmail /> },
      { path: "/careers/:slug", element: <Careers /> },
      { path: "/careers/:slug/:jobId", element: <CareerJobDetail /> },
      { path: "/careers/:slug/:jobId/apply", element: <CareerApply /> },
      { path: "/careers/:slug/:jobId/success", element: <ApplicationSuccess /> },
      {
        path: "/ats",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <ATS />
          </ProtectedRoute>
        ),
      },
      {
        path: "/candidates/:id",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <CandidateDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "/candidates/:id/edit",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <CandidateEdit />
          </ProtectedRoute>
        ),
      },
      {
        path: "/interviews",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <Interviews />
          </ProtectedRoute>
        ),
      },
      {
        path: "/notifications",
        element: (
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        ),
      },
      {
        path: "/company-settings",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <CompanySettings />
          </ProtectedRoute>
        ),
      },
      {
        path: "/overview",
        element: (
          <ProtectedRoute>
            <Overview />
          </ProtectedRoute>
        ),
      },
      {
        path: "/task",
        element: (
          <ProtectedRoute>
            <Task />
          </ProtectedRoute>
        ),
      },
      {
        path: "/message",
        element: (
          <ProtectedRoute>
            <Message />
          </ProtectedRoute>
        ),
      },
      {
        path: "/meeting",
        element: (
          <ProtectedRoute>
            <Meeting />
          </ProtectedRoute>
        ),
      },
      {
        path: "/meeting/:meetingId",
        element: (
          <ProtectedRoute>
            <MeetingRoom />
          </ProtectedRoute>
        ),
      },
      {
        path: "/join/:meetingId",
        element: <GuestJoin />,
      },
      {
        path: "/join/:meetingId/room",
        element: <MeetingRoom />,
      },
      {
        path: "/calendar",
        element: (
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        ),
      },
      {
        path: "/report",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <Report />
          </ProtectedRoute>
        ),
      },
      {
        path: "/attendance",
        element: (
          <ProtectedRoute>
            <Attendance_Info />
          </ProtectedRoute>
        ),
      },
      {
        path: "/attendance/smart-checkin",
        element: (
          <ProtectedRoute>
            <SmartCheckIn />
          </ProtectedRoute>
        ),
      },
      {
        path: "/leaves",
        element: (
          <ProtectedRoute>
            <Leaves />
          </ProtectedRoute>
        ),
      },

      {
        path: "/event",
        element: (
          <ProtectedRoute>
            <Event />
          </ProtectedRoute>
        ),
      },
      {
        path: "/search",
        element: (
          <ProtectedRoute>
            <SearchBarInAll />
          </ProtectedRoute>
        ),
      },
      {
        path: "/EmployeeRegistration",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <EmployeeRegistration />
          </ProtectedRoute>
        ),
      },
      {
        path: "/job-postings",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <Job_Postings />
          </ProtectedRoute>
        ),
      },
      {
        path: "/resume-screening",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <ResumeScreening />
          </ProtectedRoute>
        ),
      },
      {
        path: "/interview-scheduling-coordination",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <InterviewSchedulingCoordination />
          </ProtectedRoute>
        ),
      },
      {
        path: "/JobPostings",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <Job_Postings />
          </ProtectedRoute>
        ),
      },
      {
        path: "/conducting-interviews",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <ConductingInterviews />
          </ProtectedRoute>
        ),
      },
      {
        path: "/Job-post-form",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <Job_post_form />
          </ProtectedRoute>
        ),
      },
      {
        path: "/Job-post-form/:id",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <Job_post_form />
          </ProtectedRoute>
        ),
      },
      {
        path: "/new-employee-orientation",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <NewEmployeeOrientation />
          </ProtectedRoute>
        ),
      },
      {
        path: "/document-verification",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <DocumentVerification />
          </ProtectedRoute>
        ),
      },
      {
        path: "/system-access-setup",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <SystemAccessSetup />
          </ProtectedRoute>
        ),
      },
      {
        path: "/welcome-kits",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <WelcomeKits />
          </ProtectedRoute>
        ),
      },
      {
        path: "/Maintaining-employee-files",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <MaintainingEmployeeFiles />
          </ProtectedRoute>
        ),
      },
      {
        path: "/keeping-records-updated",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <KeepingRecordsUpdated />
          </ProtectedRoute>
        ),
      },
      {
        path: "/Handling-confidential-information",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <HandlingConfidentialInformation />
          </ProtectedRoute>
        ),
      },
      {
        path: "/managing-salaries-bonuses-and-incentives",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <ManagingSalariesBonuses />
          </ProtectedRoute>
        ),
      },
      {
        path: "/coordinating-with-finance",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <CoordinatingWithFinance />
          </ProtectedRoute>
        ),
      },
      {
        path: "/Attendance-leave-tracking",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <AttendanceLeaveTracking />
          </ProtectedRoute>
        ),
      },
      {
        path: "/health-insurance",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <HealthInsurance />
          </ProtectedRoute>
        ),
      },
      {
        path: "/provident-fund-gratuity",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <ProvidentFundGratuity />
          </ProtectedRoute>
        ),
      },
      {
        path: "/other-perks-reimbursements",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <OtherPerksReimbursements />
          </ProtectedRoute>
        ),
      },
      {
        path: "/appraisal-processes",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <AppraisalProcesses />
          </ProtectedRoute>
        ),
      },
      {
        path: "/goal-setting",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <GoalSetting />
          </ProtectedRoute>
        ),
      },
      {
        path: "/feedback-collection",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <FeedbackCollection />
          </ProtectedRoute>
        ),
      },
      {
        path: "/promotions-terminations",
        element: (
          <ProtectedRoute role={ADMIN_ROLES}>
            <PromotionsTerminations />
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
  </StrictMode>,
);
