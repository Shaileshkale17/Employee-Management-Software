import express from "express";
import {
  OneDepartmentInfo,
  allDepartmentInfo,
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from "../Controller/Department.js";
import {
  authMiddleware,
  tenantMiddleware,
  authorize,
} from "../Middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.post(
  "/Dep-post",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager"),
  (req, res) => createDepartment(req, res, req.app.locals.io)
);
router.get("/Dep-all", (req, res) => allDepartmentInfo(req, res, req.app.locals.io));
router.get("/Dep-one/:id", (req, res) => OneDepartmentInfo(req, res, req.app.locals.io));
router.put(
  "/Dep-update/:id",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager"),
  (req, res) => updateDepartment(req, res, req.app.locals.io)
);
router.delete(
  "/Dep-delete/:id",
  authorize("Super Admin", "Company Admin", "HR", "HR Manager"),
  (req, res) => deleteDepartment(req, res, req.app.locals.io)
);

export default router;
