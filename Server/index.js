import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import ConnectDB from "./Database/index.js";
import http from "http";
import { Server } from "socket.io";
import Employeerouter from "./router/Employee.routes.js";
import Departmentrouter from "./router/Department.routes.js";
dotenv.config();

const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cors());

const io = new Server(server, {
  origin: process.env.ORIGIN || "*",
});

app.use((req, res, next) => {
  req.io = io;
  next();
});
app.locals.io = io;

app.use("/api/", Employeerouter);
app.use("/api/", Departmentrouter);

ConnectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`listen on :${process.env.PORT || 3000}`);
    });

    io.on("connection", (socket) => {
      console.log("User connected with socket ID:", socket.id);

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
  })
  .catch((err) => {
    console.error(err);
  });
