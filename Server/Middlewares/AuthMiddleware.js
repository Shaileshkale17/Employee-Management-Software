import jwt from "jsonwebtoken";
import { Employee } from "../model/Employee.model.js";

export const authMiddleware = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ status: 401, message: "Token not found" });
  }
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    return res.status(401).json({ status: 401, message: "Invalid or expired token" });
  }
};

export const tenantMiddleware = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }
    const employee = await Employee.findById(req.user.id).select(
      "companyId role status name"
    );
    if (!employee) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }
    if (employee.status === "Inactive") {
      return res
        .status(403)
        .json({ status: 403, message: "Account is inactive" });
    }
    if (employee.role === "Super Admin") {
      req.companyId = null;
      req.employee = employee;
      return next();
    }
    if (!employee.companyId) {
      return res
        .status(403)
        .json({ status: 403, message: "Not associated with any company" });
    }
    req.companyId = employee.companyId;
    req.employee = employee;
    next();
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.employee?.role || req.user?.role;
    if (!userRole) {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        status: 403,
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};
