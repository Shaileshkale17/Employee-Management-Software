/* eslint-disable react-refresh/only-export-components */
import { StrictMode, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store";
import ProtectedRoute from "./Middlewares/routes.Middlewares";
import { ADMIN_ROLES } from "./Middlewares/roles";

const Login = lazy(() => import("./pages/Login"));
const OTP = lazy(() => import("./pages/OTP"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Overview = lazy(() => import("./pages/Overview"));
const Task = lazy(() => import("./pages/Task"));
const Message = lazy(() => import("./pages/Message"));
const Meeting = lazy(() => import("./pages/Meeting"));
const MeetingRoom = lazy(() => import("./pages/MeetingRoom"));
const GuestJoin = lazy(() => import("./pages/GuestJoin"));
const Attendance_Info = lazy(() => import("./pages/Attendance_Info"));
const SmartCheckIn = lazy(() => import("./pages/SmartCheckIn"));
const Leaves = lazy(() => import("./pages/Leaves"));
const Report = lazy(() => import("./pages/Report"));
const Event = lazy(() => import("./pages/Event"));
const EmployeeRegistration = lazy(() => import("./pages/EmployeeRegistration"));
const SearchBarInAll = lazy(() => import("./components/scarchBerInAll"));
const Unauthorized = lazy(() => import("./components/unauthorized"));
const Job_Postings = lazy(() => import("./pages/Job_Postings"));
const InterviewSchedulingCoordination = lazy(() => import("./pages/InterviewSchedulingCoordination"));
const ResumeScreening = lazy(() => import("./pages/ResumeScreening"));
const ConductingInterviews = lazy(() => import("./pages/ConductingInterviews"));
const Job_post_form = lazy(() => import("./pages/Job_post_form"));
const NewEmployeeOrientation = lazy(() => import("./pages/NewEmployeeOrientation"));
const DocumentVerification = lazy(() => import("./pages/DocumentVerification"));
const SystemAccessSetup = lazy(() => import("./pages/SystemAccessSetup"));
const WelcomeKits = lazy(() => import("./pages/WelcomeKits"));
const CompanyRegistration = lazy(() => import("./pages/CompanyRegistration"));
const VerifyCompanyEmail = lazy(() => import("./pages/VerifyCompanyEmail"));
const Careers = lazy(() => import("./pages/Careers"));
const CareerJobDetail = lazy(() => import("./pages/CareerJobDetail"));
const CareerApply = lazy(() => import("./pages/CareerApply"));
const ApplicationSuccess = lazy(() => import("./pages/ApplicationSuccess"));
const ATS = lazy(() => import("./pages/ATS"));
const CandidateDetail = lazy(() => import("./pages/CandidateDetail"));
const CandidateEdit = lazy(() => import("./pages/CandidateEdit"));
const Interviews = lazy(() => import("./pages/Interviews"));
const Notifications = lazy(() => import("./pages/Notifications"));
const CompanySettings = lazy(() => import("./pages/CompanySettings"));
const Calendar = lazy(() => import("./pages/Calendar"));
const MaintainingEmployeeFiles = lazy(() => import("./pages/MaintainingEmployeeFiles"));
const KeepingRecordsUpdated = lazy(() => import("./pages/KeepingRecordsUpdated"));
const HandlingConfidentialInformation = lazy(() => import("./pages/HandlingConfidentialInformation"));
const ManagingSalariesBonuses = lazy(() => import("./pages/ManagingSalariesBonuses"));
const CoordinatingWithFinance = lazy(() => import("./pages/CoordinatingWithFinance"));
const AttendanceLeaveTracking = lazy(() => import("./pages/AttendanceLeaveTracking"));
const HealthInsurance = lazy(() => import("./pages/HealthInsurance"));
const ProvidentFundGratuity = lazy(() => import("./pages/ProvidentFundGratuity"));
const OtherPerksReimbursements = lazy(() => import("./pages/OtherPerksReimbursements"));
const AppraisalProcesses = lazy(() => import("./pages/AppraisalProcesses"));
const GoalSetting = lazy(() => import("./pages/GoalSetting"));
const FeedbackCollection = lazy(() => import("./pages/FeedbackCollection"));
const PromotionsTerminations = lazy(() => import("./pages/PromotionsTerminations"));

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
