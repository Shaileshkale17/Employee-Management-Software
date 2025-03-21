import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import ConnectDB from "./Database/index.js";
import http from "http";
import { Server } from "socket.io";
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

ConnectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`listen on :${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.error(err);
  });
