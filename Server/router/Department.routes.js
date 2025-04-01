import express from "express";
import { createDepartment } from "../Controller/Department.js";

const router = express.Router();

router.post("/Dep-post", (req, res) =>
  createDepartment(req, res, req.app.locals.io)
);

export default router;
