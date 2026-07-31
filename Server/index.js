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
import { globalLimiter, authLimiter } from "./Middlewares/rateLimiter.js";
import { Employee } from "./model/Employee.model.js";

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
    });

    io.on("connection", (socket) => {
      console.log("User connected with socket ID:", socket.id);

      socket.on("authenticate", async ({ token }) => {
        try {
          const verified = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = verified.id;
          socket.join(`user:${verified.id}`);
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
          const data = await Employee.findByIdAndUpdate(
            id,
            { online: isOnline },
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
          socket.join(`user:${userId}`);
          socket.userId = userId;
        }
      });

      socket.on("disconnect", () => {
        if (socket.userId) {
          Employee.findByIdAndUpdate(socket.userId, { online: false }).catch(() => {});
        }
        console.log("User disconnected:", socket.id);
      });
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
