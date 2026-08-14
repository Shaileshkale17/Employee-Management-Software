import express from "express";
import {
  createTask,
  getTasks,
  getMyTasks,
  updateTask,
  deleteTask,
  getTaskStats,
} from "../Controller/Task.js";
import { authMiddleware, tenantMiddleware, authorize } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/stats", (req, res) => getTaskStats(req, res));
router.get("/my", (req, res) => getMyTasks(req, res));

router.post("/", authorize("Super Admin", "Company Admin", "HR", "HR Manager"), (req, res) => createTask(req, res));
router.get("/", (req, res) => getTasks(req, res));
router.put("/:id", (req, res) => updateTask(req, res));
router.delete("/:id", authorize("Super Admin", "Company Admin", "HR", "HR Manager"), (req, res) => deleteTask(req, res));

export default router;
