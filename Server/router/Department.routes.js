import express from "express";
import {
  OneDepartmentInfo,
  allDepartmentInfo,
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from "../Controller/Department.js";

const router = express.Router();

router.post("/Dep-post", (req, res) =>
  createDepartment(req, res, req.app.locals.io)
);
router.get("/Dep-all", (req, res) =>
  allDepartmentInfo(req, res, req.app.locals.io)
);
router.get("/Dep-one/:id", (req, res) =>
  OneDepartmentInfo(req, res, req.app.locals.io)
);
router.put("/Dep-update/:id", (req, res) =>
  updateDepartment(req, res, req.app.locals.io)
);
router.delete("/Dep-delete/:id", (req, res) =>
  deleteDepartment(req, res, req.app.locals.io)
);

export default router;
