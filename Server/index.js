import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import ConnectDB from "./Database/index.js";
import http from "http";
import { Server } from "socket.io";
import Employeerouter from "./router/Employee.routes.js";
import Departmentrouter from "./router/Department.routes.js";
import Eventouter from "./router/Event.routes.js";
import { Employee } from "./model/Employee.model.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
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

      // Listen for custom event "All_Employee_Info" from this client
      socket.on("All_Employee_Info", async () => {
        try {
          const data = await Employee.aggregate([
            {
              $unwind: {
                path: "$Department",
                preserveNullAndEmptyArrays: true, // Include users without Department
              },
            },
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

          // Send response back to client who requested it
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

      // Listen for custom event "All_Department_Info" from this client
      socket.on("All_Department_Info", async () => {
        try {
          const data = await Employee.aggregate([
            {
              $unwind: {
                path: "$Department",
                preserveNullAndEmptyArrays: true, // Include users without Department
              },
            },
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

          // Send response back to client who requested it
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
      // Listen for custom event "All_update_STatus_Info" from this client
      socket.on("All_update_Status_Info", async ({ id, isOnline }) => {
        console.log("All_update_STatus_Info", { id });

        try {
          const data = await Employee.findByIdAndUpdate(
            id,
            {
              status: isOnline,
            },
            { new: true }
          );
          // Send response back to client who requested it
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

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
