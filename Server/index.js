import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import ConnectDB from "./Database/index.js";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import path from "path";
import Employeerouter from "./router/Employee.routes.js";
import Departmentrouter from "./router/Department.routes.js";
import Eventouter from "./router/Event.routes.js";
import Onboardingrouter from "./router/Onboarding.routes.js";
import Jobrouter from "./router/Job.routes.js";
import Candidaterouter from "./router/Candidate.routes.js";
import Applicationrouter from "./router/Application.routes.js";
import Interviewrouter from "./router/Interview.routes.js";
import Companyrouter from "./router/Company.routes.js";
import Notificationrouter from "./router/Notification.routes.js";
import CalendarEventrouter from "./router/CalendarEvent.routes.js";
import Attendancerouter from "./router/Attendance.routes.js";
import Leaverouter from "./router/Leave.routes.js";
import Taskrouter from "./router/Task.routes.js";
import Shiftrouter from "./router/Shift.routes.js";
import Reportrouter from "./router/Report.routes.js";
import ActivityLogrouter from "./router/ActivityLog.routes.js";
import Messagerouter from "./router/Message.routes.js";
import Meetingrouter from "./router/Meeting.routes.js";
import MeetingMessagerouter from "./router/MeetingMessage.routes.js";
import Recordingrouter from "./router/Recording.routes.js";
import EmployeeRecordrouter from "./router/EmployeeRecord.routes.js";
import Payrollrouter from "./router/Payroll.routes.js";
import FinanceCoordinationrouter from "./router/FinanceCoordination.routes.js";
import Benefitrouter from "./router/Benefit.routes.js";
import Performancerouter from "./router/Performance.routes.js";
import { globalLimiter, authLimiter } from "./Middlewares/rateLimiter.js";
import { startReminderScheduler } from "./utils/reminderScheduler.js";
import { startAttendanceScheduler } from "./utils/attendanceScheduler.js";
import { Employee } from "./model/Employee.model.js";
import { Meeting } from "./model/Meeting.model.js";
import { MeetingParticipant } from "./model/Participant.model.js";
import { verifyGuestToken } from "./utils/meetingSecurity.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(cors());

app.use("/uploads", express.static(path.resolve("uploads")));

app.use("/api", globalLimiter);
app.use("/api/emp/emp-login", authLimiter);
app.use("/api/company/register", authLimiter);

const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

app.use((req, res, next) => {
  req.io = io;
  next();
});
app.locals.io = io;

app.use("/api/emp/", Employeerouter);
app.use("/api/dep/", Departmentrouter);
app.use("/api/event/", Eventouter);
app.use("/api/onboarding/", Onboardingrouter);
app.use("/api/job/", Jobrouter);
app.use("/api/candidate/", Candidaterouter);
app.use("/api/application/", Applicationrouter);
app.use("/api/interview/", Interviewrouter);
app.use("/api/company/", Companyrouter);
app.use("/api/notification/", Notificationrouter);
app.use("/api/calendar/", CalendarEventrouter);
app.use("/api/attendance/", Attendancerouter);
app.use("/api/leave/", Leaverouter);
app.use("/api/task/", Taskrouter);
app.use("/api/shift/", Shiftrouter);
app.use("/api/report/", Reportrouter);
app.use("/api/activity/", ActivityLogrouter);
app.use("/api/message/", Messagerouter);
app.use("/api/meeting/", Meetingrouter);
app.use("/api/meeting-message/", MeetingMessagerouter);
app.use("/api/recording/", Recordingrouter);
app.use("/api/emp-record/", EmployeeRecordrouter);
app.use("/api/payroll/", Payrollrouter);
app.use("/api/finance/", FinanceCoordinationrouter);
app.use("/api/benefit/", Benefitrouter);
app.use("/api/performance/", Performancerouter);

app.get("/", (req, res) => {
  res.json({ message: "Employee Management API", status: "running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  if (err?.message?.includes("Invalid file type") || err?.message?.includes("Invalid image")) {
    return res.status(400).json({ message: err.message });
  }
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large. Maximum allowed size is 5MB." });
  }
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body too large" });
  }
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

ConnectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Listening on port: ${PORT}`);
      startReminderScheduler(io);
      startAttendanceScheduler();
    });

    const joinRooms = async (socket, userId) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
      try {
        const emp = await Employee.findById(userId).select("companyId name");
        if (emp?.companyId) {
          socket.join(`company:${String(emp.companyId)}`);
          socket.companyId = emp.companyId;
        }
        if (emp?.name) socket.employeeName = emp.name;
      } catch (error) {
        console.error("Failed to join company room:", error.message);
      }
    };

    const updatePresence = async (socket, presence) => {
      if (!socket.userId) return;
      const now = new Date();
      await Employee.updateOne(
        { _id: socket.userId },
        { presence, online: presence !== "offline", lastActive: now }
      ).catch(() => {});
      socket.data = socket.data || {};
      socket.data.presence = presence;
      if (socket.companyId) {
        io.to(`company:${String(socket.companyId)}`).emit("presence:update", {
          userId: socket.userId,
          presence,
          lastActive: now,
        });
      }
    };

    io.on("connection", (socket) => {
      console.log("User connected with socket ID:", socket.id);

      socket.on("authenticate", async ({ token }) => {
        try {
          const verified = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = verified.id;
          await joinRooms(socket, verified.id);
          await updatePresence(socket, "online");
          socket.emit("authenticated", { ok: true });
        } catch (error) {
          socket.emit("authenticated", { ok: false, message: "Invalid token" });
        }
      });

      socket.on("All_Employee_Info", async () => {
        try {
          const data = await Employee.aggregate([
            {
              $lookup: {
                from: "departments",
                localField: "department",
                foreignField: "_id",
                as: "DepartmentDetails",
              },
            },
            {
              $unwind: {
                path: "$DepartmentDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
          ]);

          socket.emit("All_Employee_Info_Response", {
            message: "All employees have been retrieved",
            count: data.length,
            data,
          });
        } catch (error) {
          console.error("Error fetching employee info:", error);
          socket.emit("All_Employee_Info_Response", {
            message: "Error retrieving employee data",
            error: error.message,
          });
        }
      });

      socket.on("All_Department_Info", async () => {
        try {
          const data = await Employee.aggregate([
            {
              $lookup: {
                from: "departments",
                localField: "department",
                foreignField: "_id",
                as: "DepartmentDetails",
              },
            },
            {
              $unwind: {
                path: "$DepartmentDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
          ]);

          socket.emit("All_Department_Info_Response", {
            message: "All Department have been retrieved",
            count: data.length,
            data,
          });
        } catch (error) {
          console.error("Error fetching employee info:", error);
          socket.emit("All_Department_Info_Response", {
            message: "Error retrieving employee data",
            error: error.message,
          });
        }
      });

      socket.on("All_update_Status_Info", async ({ id, isOnline }) => {
        try {
          const online =
            typeof isOnline === "string"
              ? isOnline === "Active" || isOnline === "true" || isOnline === "1"
              : !!isOnline;
          const data = await Employee.findByIdAndUpdate(
            id,
            { online },
            { new: true }
          );
          socket.emit("status_Response", {
            message: "Employee status updated successfully",
            data,
          });
        } catch (error) {
          console.error("Error updating employee status:", error);
          socket.emit("status_Response", {
            message: "Error updating employee status",
            error: error.message,
          });
        }
      });

      socket.on("register", (userId) => {
        if (userId) {
          socket.userId = userId;
          joinRooms(socket, userId);
          updatePresence(socket, "online");
        }
      });

      // ---------- Presence ----------
      socket.on("presence:update", ({ presence } = {}) => {
        const allowed = ["online", "away", "busy", "idle", "offline"];
        if (!allowed.includes(presence)) return;
        updatePresence(socket, presence);
      });

      // ---------- Meeting rooms ----------
      const meetingPresence = new Map();

      const activeMeetingId = () =>
        Array.from(socket.rooms || []).find((r) => r.startsWith("meeting:"))?.slice(8);

      const identityOf = (s) => ({
        socketId: s.id,
        userId: s.data?.userId || null,
        guestSession: s.data?.guestSession || null,
        name: s.data?.name || null,
        email: s.data?.email || null,
        isHost: Boolean(s.data?.isHost),
        participantId: s.data?.participantId || null,
      });

      const updateLiveCount = async (ioInstance, meetingId) => {
        try {
          const sockets = await ioInstance.in(`meeting:${meetingId}`).fetchSockets();
          await Meeting.updateOne({ meetingId }, { liveParticipantCount: sockets.length });
        } catch (error) {
          console.error("Failed to update live participant count:", error.message);
        }
      };

      const emitMeetingPresence = async (ioInstance, meetingId) => {
        const sockets = await ioInstance.in(`meeting:${meetingId}`).fetchSockets();
        const present = sockets.map(identityOf).filter((p) => p.userId || p.guestSession);
        ioInstance.to(`meeting:${meetingId}`).emit("meeting:presence", present);
        await updateLiveCount(ioInstance, meetingId);
      };

      const markJoined = async (meetingId) => {
        const { userId, guestSession, isHost } = socket.data || {};
        if (!userId && !guestSession) return;
        try {
          const meeting = await Meeting.findOne({ meetingId }).select("_id");
          if (!meeting) return;
          const query = userId
            ? { meeting: meeting._id, employee: userId }
            : { meeting: meeting._id, joinToken: guestSession };
          const participant = await MeetingParticipant.findOneAndUpdate(
            query,
            {
              status: "joined",
              $set: {
                "attendance.joinedAt": new Date(),
                "attendance.wasHost": Boolean(isHost),
              },
            },
            { new: true }
          );
          if (participant) socket.data.participantId = String(participant._id);
        } catch (error) {
          console.error("Failed to mark participant joined:", error.message);
        }
      };

      const markLeft = async (meetingId) => {
        const { userId, guestSession, participantId } = socket.data || {};
        try {
          const meeting = await Meeting.findOne({ meetingId }).select("_id");
          if (!meeting) return;
          const query = participantId
            ? { _id: participantId }
            : userId
              ? { meeting: meeting._id, employee: userId }
              : { meeting: meeting._id, joinToken: guestSession };
          const participant = await MeetingParticipant.findOne(query);
          if (!participant) return;
          const joinedAt = participant.attendance?.joinedAt || new Date();
          const leftAt = new Date();
          const durationMinutes = Math.max(0, Math.round((leftAt - new Date(joinedAt)) / 60000));
          participant.status = "left";
          participant.attendance = {
            ...(participant.attendance || {}),
            leftAt,
            durationMinutes,
            wasHost: Boolean(socket.data?.isHost || participant.attendance?.wasHost),
          };
          await participant.save();
        } catch (error) {
          console.error("Failed to mark participant left:", error.message);
        }
      };

      socket.on("meeting:join", async (payload) => {
        const { meetingId, token } = payload || {};
        if (!meetingId) return;
        try {
          let identity = null;
          if (token) {
            const guest = verifyGuestToken(token);
            if (guest?.meetingId === meetingId) {
              identity = {
                type: "guest",
                sessionId: guest.sessionId,
                name: guest.name,
                email: guest.email,
              };
            }
          }
          if (!identity && socket.userId) {
            const emp = await Employee.findById(socket.userId).select("name email role companyId");
            if (emp) {
              identity = {
                type: "employee",
                id: String(socket.userId),
                name: emp.name,
                email: emp.email,
                role: emp.role,
              };
            }
          }
          if (!identity) {
            socket.emit("meeting:error", {
              message: "You must authenticate before joining a meeting room",
            });
            return;
          }

          const meeting = await Meeting.findOne({ meetingId });
          if (!meeting) {
            socket.emit("meeting:error", { message: "Meeting not found" });
            return;
          }

          socket.data.userId = identity.id || null;
          socket.data.guestSession = identity.sessionId || null;
          socket.data.name = identity.name;
          socket.data.email = identity.email;
          socket.data.meetingId = meetingId;
          socket.data.isHost =
            identity.type === "employee" && String(meeting.organizer) === String(identity.id);

          const alreadyInMeeting = Array.from(socket.rooms || []).includes(`meeting:${meetingId}`);

          if (!alreadyInMeeting && identity.type === "employee") {
            const participant = await MeetingParticipant.findOne({
              meeting: meeting._id,
              employee: identity.id,
            });
            const privileged = ["host", "cohost", "moderator", "interviewer"].includes(
              participant?.role
            );
            const admitted = ["joined", "admitted"].includes(participant?.status);
            if (!socket.data.isHost && !privileged && !admitted) {
              await socket.join(`waiting:${meetingId}`);
              socket.data.waiting = true;
              socket.emit("meeting:waiting", {
                meetingId,
                message: "You're in the waiting room. The host will let you in shortly.",
              });
              return;
            }
          }

          socket.data.waiting = false;
          socket.data.participantId = null;
          await socket.join(`meeting:${meetingId}`);
          await socket.join(`meeting:${String(meeting._id)}`);
          meetingPresence.set(meetingId, (meetingPresence.get(meetingId) || 0) + 1);

          await markJoined(meetingId);

          if (!alreadyInMeeting) {
            socket.to(`meeting:${meetingId}`).emit("meeting:joined", {
              userId: identity.id,
              guestSession: identity.sessionId,
              name: identity.name,
              email: identity.email,
            });
          }
          await emitMeetingPresence(io, meetingId);
        } catch (error) {
          socket.emit("meeting:error", { message: error.message });
        }
      });

      socket.on("meeting:leave", async ({ meetingId } = {}) => {
        const mid = meetingId || activeMeetingId();
        if (!mid) return;
        const count = meetingPresence.get(mid) || 0;
        if (count <= 1) meetingPresence.delete(mid);
        else meetingPresence.set(mid, count - 1);
        socket.to(`meeting:${mid}`).emit("meeting:left", {
          userId: socket.data?.userId,
          guestSession: socket.data?.guestSession,
          name: socket.data?.name,
        });
        socket.leave(`meeting:${mid}`);
        socket.data.waiting = false;
        await markLeft(mid);
        await emitMeetingPresence(io, mid);
      });

      socket.on("meeting:typing", ({ meetingId, isTyping } = {}) => {
        const mid = meetingId || activeMeetingId();
        if (!mid) return;
        socket.to(`meeting:${mid}`).emit("meeting:typing", {
          userId: socket.data?.userId,
          guestSession: socket.data?.guestSession,
          name: socket.data?.name,
          isTyping: Boolean(isTyping),
        });
      });

      socket.on("meeting:raise-hand", ({ meetingId, raised } = {}) => {
        const mid = meetingId || activeMeetingId();
        if (!mid) return;
        socket.to(`meeting:${mid}`).emit("meeting:raise-hand", {
          userId: socket.data?.userId,
          guestSession: socket.data?.guestSession,
          name: socket.data?.name,
          raised: Boolean(raised),
        });
      });

      socket.on("meeting:react", ({ meetingId, emoji } = {}) => {
        const mid = meetingId || activeMeetingId();
        if (!mid || !emoji) return;
        socket.to(`meeting:${mid}`).emit("meeting:react", {
          userId: socket.data?.userId,
          guestSession: socket.data?.guestSession,
          name: socket.data?.name,
          emoji,
        });
      });

      socket.on("meeting:signal", ({ meetingId, to, data } = {}) => {
        const mid = meetingId || activeMeetingId();
        if (!mid) return;
        const target = io.sockets.sockets.get(to);
        if (target) {
          target.emit("meeting:signal", {
            from: socket.id,
            fromUser: {
              userId: socket.data?.userId,
              guestSession: socket.data?.guestSession,
              name: socket.data?.name,
            },
            data,
          });
        } else {
          socket.to(`meeting:${mid}`).emit("meeting:signal", {
            from: socket.id,
            fromUser: {
              userId: socket.data?.userId,
              guestSession: socket.data?.guestSession,
              name: socket.data?.name,
            },
            data,
          });
        }
      });

      socket.on("meeting:media-state", ({ meetingId, state } = {}) => {
        const mid = meetingId || activeMeetingId();
        if (!mid || !state || typeof state !== "object") return;
        socket.to(`meeting:${mid}`).emit("meeting:media-state", {
          socketId: socket.id,
          userId: socket.data?.userId,
          guestSession: socket.data?.guestSession,
          name: socket.data?.name,
          state: {
            micOn: Boolean(state.micOn),
            camOn: Boolean(state.camOn),
            screenSharing: Boolean(state.screenSharing),
          },
        });
      });

      socket.on("meeting:mute-all", ({ meetingId } = {}) => {
        const mid = meetingId || activeMeetingId();
        if (!mid) return;
        if (!socket.data?.isHost) {
          socket.emit("meeting:error", { message: "Only the host can mute all participants" });
          return;
        }
        socket.to(`meeting:${mid}`).emit("meeting:force-mute", {});
      });

      socket.on("meeting:remove", async ({ meetingId, targetSocketId } = {}) => {
        const mid = meetingId || activeMeetingId();
        if (!mid || !targetSocketId) return;
        if (!socket.data?.isHost) {
          socket.emit("meeting:error", { message: "Only the host can remove participants" });
          return;
        }
        const target = io.sockets.sockets.get(targetSocketId);
        if (target) {
          target.emit("meeting:removed", {
            meetingId: mid,
            message: "You were removed from the meeting by the host.",
          });
          target.leave(`meeting:${mid}`);
          const meeting = await Meeting.findOne({ meetingId: mid }).select("_id");
          if (meeting) target.leave(`meeting:${String(meeting._id)}`);
          const pid = target.data?.participantId;
          if (pid) {
            await MeetingParticipant.updateOne(
              { _id: pid },
              { status: "left", $set: { "attendance.leftAt": new Date() } }
            );
          }
        }
        await emitMeetingPresence(io, mid);
      });

      socket.on("meeting:whiteboard:stroke", ({ meetingId, prev, x, y, color, size } = {}) => {
        const mid = meetingId || activeMeetingId();
        if (!mid || !prev) return;
        socket.to(`meeting:${mid}`).emit("meeting:whiteboard:stroke", {
          userId: socket.data?.userId,
          name: socket.data?.name,
          prev,
          x,
          y,
          color,
          size,
        });
      });

      socket.on("meeting:whiteboard:clear", ({ meetingId } = {}) => {
        const mid = meetingId || activeMeetingId();
        if (!mid) return;
        socket.to(`meeting:${mid}`).emit("meeting:whiteboard:clear", {});
      });

      socket.on("meeting:record", async ({ meetingId, recording } = {}) => {
        const mid = meetingId || activeMeetingId();
        if (!mid) return;
        socket.to(`meeting:${mid}`).emit("meeting:record", Boolean(recording));
      });

      // ---------- Direct chat ----------
      socket.on("chat:typing", ({ recipient, isTyping } = {}) => {
        if (!recipient || !socket.userId) return;
        if (String(recipient) === String(socket.userId)) return;
        socket.to(`user:${recipient}`).emit("chat:typing", {
          userId: socket.userId,
          name: socket.employeeName || socket.data?.name || "",
          isTyping: Boolean(isTyping),
        });
      });

      socket.on("disconnect", async () => {
        const mid = activeMeetingId();
        if (mid) {
          const count = meetingPresence.get(mid) || 0;
          if (count <= 1) meetingPresence.delete(mid);
          else meetingPresence.set(mid, count - 1);
          socket.to(`meeting:${mid}`).emit("meeting:left", {
            userId: socket.data?.userId,
            guestSession: socket.data?.guestSession,
            name: socket.data?.name,
          });
          socket.leave(`meeting:${mid}`);
          await markLeft(mid);
          await emitMeetingPresence(io, mid);
        }
        if (socket.userId) {
          updatePresence(socket, "offline");
        }
        console.log("User disconnected:", socket.id);
      });
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
