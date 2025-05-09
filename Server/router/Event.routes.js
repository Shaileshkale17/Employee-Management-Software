import express from "express";
import {
  DeleteEvent,
  GetEvent,
  GetOneEvent,
  PostEvent,
  updateEvent,
} from "../Controller/Event.js";

const router = express.Router();

router.post("/event-post", (req, res) =>
  PostEvent(req, res, req.app.locals.io)
);
router.get("/event-all", (req, res) => GetEvent(req, res, req.app.locals.io));
router.get("/event-show/:id", (req, res) =>
  GetOneEvent(req, res, req.app.locals.io)
);

router.put("/event-update/:id", (req, res) =>
  updateEvent(req, res, req.app.locals.io)
);
router.delete("/event-delete/:id", (req, res) =>
  DeleteEvent(req, res, req.app.locals.io)
);

export default router;
