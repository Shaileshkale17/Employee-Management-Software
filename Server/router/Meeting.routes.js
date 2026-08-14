import express from "express";
import {
  createMeeting,
  getMyPersonalRoom,
  getMeetings,
  getMeetingByMeetingId,
  getMeetingById,
  updateMeeting,
  cancelMeeting,
  deleteMeeting,
  startMeeting,
  endMeeting,
  joinMeeting,
  createInstantMeeting,
  getParticipants,
  updateParticipant,
  admitParticipant,
  removeParticipant,
  createGuestInvitation,
  getInvitations,
  getAttendanceReport,
  getMeetingAnalytics,
  getMeetingChannel,
  listForDashboard,
} from "../Controller/Meeting.js";
import {
  getInvitationByToken,
  verifyGuestOtp,
  resendGuestOtp,
} from "../Controller/Meeting.js";
import {
  authMiddleware,
  tenantMiddleware,
} from "../Middlewares/AuthMiddleware.js";
import { meetingGuestAuth } from "../Middlewares/meetingAuthMiddleware.js";

const router = express.Router();

// ---- Public guest routes (no JWT) ----
router.get("/public/invite/:token", (req, res) => getInvitationByToken(req, res));
router.post("/public/verify", (req, res) => verifyGuestOtp(req, res));
router.post("/public/resend-otp", (req, res) => resendGuestOtp(req, res));
router.post("/public/join/:meetingId", meetingGuestAuth, (req, res) => joinMeeting(req, res));

// ---- Protected routes ----
router.use(authMiddleware, tenantMiddleware);

router.post("/create", (req, res) => createMeeting(req, res));
router.post("/instant", (req, res) => createInstantMeeting(req, res));
router.get("/personal-room", (req, res) => getMyPersonalRoom(req, res));
router.get("/dashboard", (req, res) => listForDashboard(req, res));
router.get("/analytics", (req, res) => getMeetingAnalytics(req, res));
router.get("/", (req, res) => getMeetings(req, res));
router.get("/meetingId/:meetingId", (req, res) => getMeetingByMeetingId(req, res));

router.post("/:id/join", (req, res) => joinMeeting(req, res));
router.get("/:id/participants", (req, res) => getParticipants(req, res));
router.patch("/:id/participants/:participantId", (req, res) => updateParticipant(req, res));
router.patch("/:id/participants/:participantId/admit", (req, res) => admitParticipant(req, res));
router.delete("/:id/participants/:participantId", (req, res) => removeParticipant(req, res));
router.post("/:id/invite", (req, res) => createGuestInvitation(req, res));
router.get("/:id/invitations", (req, res) => getInvitations(req, res));
router.get("/:id/attendance", (req, res) => getAttendanceReport(req, res));
router.get("/:id/channel", (req, res) => getMeetingChannel(req, res));
router.post("/:id/start", (req, res) => startMeeting(req, res));
router.post("/:id/end", (req, res) => endMeeting(req, res));
router.put("/update/:id", (req, res) => updateMeeting(req, res));
router.patch("/:id/cancel", (req, res) => cancelMeeting(req, res));
router.delete("/delete/:id", (req, res) => deleteMeeting(req, res));
router.get("/:id", (req, res) => getMeetingById(req, res));

export default router;
