import express from "express";
import {
  EmployeeAllInfo,
  EmployeeInfoDeleted,
  EmployeeInfoUpdate,
  EmployeeOneInfo,
  createEmployee,
} from "../Controller/Employee.js";

const router = express.Router();

router.post("/emp-login", (req, res) =>
  createEmployee(req, res, req.app.locals.io)
);
router.post("/emp-post", (req, res) =>
  createEmployee(req, res, req.app.locals.io)
);
router.get("/emp-get", (req, res) =>
  EmployeeAllInfo(req, res, req.app.locals.io)
);
router.get("/emp-get-one:id", (req, res) =>
  EmployeeOneInfo(req, res, req.app.locals.io)
);
router.put("/emp-get-update/:id", (req, res) =>
  EmployeeInfoUpdate(req, res, req.app.locals.io)
);
router.delete("/emp-get-deleted/:id", (req, res) =>
  EmployeeInfoDeleted(req, res, req.app.locals.io)
);

export default router;
