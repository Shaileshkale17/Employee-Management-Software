import express from "express";
import {
  DeleteEvent,
  GetEvent,
  GetOneEvent,
  PostEvent,
  updateEvent,
} from "../Controller/Event.js";
import { authMiddleware, tenantMiddleware, authorize } from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.post("/event-post", authorize("Super Admin", "Company Admin", "HR", "HR Manager"), (req, res) =>
  PostEvent(req, res, req.app.locals.io)
);
router.get("/event-all", (req, res) => GetEvent(req, res, req.app.locals.io));
router.get("/event-show/:id", (req, res) => GetOneEvent(req, res, req.app.locals.io));
router.put("/event-update/:id", authorize("Super Admin", "Company Admin", "HR", "HR Manager"), (req, res) =>
  updateEvent(req, res, req.app.locals.io)
);
router.delete("/event-delete/:id", authorize("Super Admin", "Company Admin", "HR", "HR Manager"), (req, res) =>
  DeleteEvent(req, res, req.app.locals.io)
);

export default router;
