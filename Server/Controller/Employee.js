import { Employee } from "../model/Employee.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { notify } from "../utils/notificationService.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import {
  isValidEmail,
  isStrongPassword,
  isValidObjectId,
  sanitizeString,
} from "../utils/validation.js";
import { sendOtpEmail, sendWelcomeEmail, appBaseUrl } from "../utils/mailService.js";
import { Company } from "../model/Company.model.js";
import { logActivity } from "../utils/activityLogger.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const OTP_TTL_MINUTES = 10;

export const generateEmployeeId = async () => {
  const last = await Employee.findOne().sort({ createdAt: -1 });
  let num = 1;
  if (last?.employeeId && /^\d+$/.test(last.employeeId)) {
    num = parseInt(last.employeeId, 10) + 1;
  } else {
    num = Math.floor(1 + Math.random() * 9000);
  }
  return String(num);
};

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
      employeeId: user.employeeId,
      companyId: user.companyId,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

const publicUser = (user) => ({
  id: user._id,
  FullName: user.name,
  name: user.name,
  email: user.email,
  employeeId: user.employeeId,
  role: user.role,
  companyId: user.companyId,
  department: user.department,
  designation: user.designation,
  profileImg: user.profileImg,
  workLocation: user.workLocation,
  phone: user.phone,
  address: user.address,
  status: user.status,
  mfaEnabled: user.mfaEnabled,
  isEmailVerified: user.isEmailVerified,
});

export const createEmployee = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    department,
    designation,
    salary = {},
  } = req.body || {};

  try {
    if ([name, email, password, role].some((f) => !f || String(f).trim() === "")) {
      return res.status(400).json(new ApiError(400, "All fields are required"));
    }
    if (!isValidEmail(email)) {
      return res.status(400).json(new ApiError(400, "Invalid email address"));
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json(new ApiError(400, "Password must be at least 6 characters"));
    }
    const validRoles = [
      "Super Admin",
      "Company Admin",
      "HR",
      "HR Manager",
      "Recruiter",
      "Interviewer",
      "Employee",
      "developer",
    ];
    if (!validRoles.includes(role)) {
      return res.status(400).json(new ApiError(400, "Invalid role"));
    }
    if (department && !isValidObjectId(department)) {
      return res.status(400).json(new ApiError(400, "Invalid department"));
    }

    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(400).json(new ApiError(400, "Employee already exists"));
    }

    const employeeId = await generateEmployeeId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await Employee.create({
      employeeId,
      name: sanitizeString(name, 100),
      email: String(email).toLowerCase().trim(),
      password: hashedPassword,
      role,
      department: department || undefined,
      designation: sanitizeString(designation, 100),
      companyId: req.companyId || undefined,
      salary: {
        ctc: salary.ctc || 0,
        basic: salary.basic || 0,
        hra: salary.hra || 0,
        allowances: salary.allowances || 0,
        deductions: {
          tax: salary.tax || 0,
          pf: salary.pf || 0,
          otherDeductions: salary.otherDeductions || 0,
        },
        netSalary: salary.netSalary || 0,
        currency: salary.currency || "INR",
        paymentFrequency: salary.paymentFrequency || "Monthly",
      },
      status: "Active",
    });

    if (req.companyId && newEmployee._id) {
      await notify({
        io: req.io,
        recipient: newEmployee._id,
        companyId: req.companyId,
        title: "Welcome aboard",
        message: `Welcome ${newEmployee.name}! Your account has been created. Your Employee ID is ${employeeId}.`,
        type: "system",
        link: "/overview",
      });
    }

    await logActivity({
      companyId: req.companyId,
      actor: req.user?.id,
      action: "employee.created",
      module: "employee",
      targetType: "Employee",
      targetId: newEmployee._id,
      details: { email: newEmployee.email },
      ip: req.ip,
    });

    // Welcome email after successful DB save. Fire-and-forget so an email
    // provider failure never rolls back or blocks employee creation.
    if (newEmployee.email) {
      (async () => {
        try {
          let companyName = null;
          if (newEmployee.companyId) {
            const company = await Company.findById(newEmployee.companyId).select("name").lean();
            companyName = company?.name || null;
          }
          await sendWelcomeEmail({
            to: newEmployee.email,
            name: newEmployee.name,
            email: newEmployee.email,
            employeeId,
            companyName,
            loginUrl: `${appBaseUrl()}/`,
          });
        } catch (emailErr) {
          console.error("Welcome email failed:", emailErr.message);
        }
      })();
    }

    return res
      .status(201)
      .json(new ApiResponse(201, publicUser(newEmployee), "Employee created successfully"));
  } catch (error) {
    console.error("createEmployee error:", error);
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const LoginEmployee = async (req, res) => {
  const { email, password } = req.body || {};
  try {
    if (!email || !password) {
      return res.status(400).json(new ApiError(400, "Email and password are required"));
    }

    const user = await Employee.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ status: 401, message: "Invalid email or password", success: false });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ status: 401, message: "Invalid email or password", success: false });
    }

    if (user.status === "Inactive") {
      return res.status(403).json({ status: 403, message: "Your account is inactive. Contact your administrator.", success: false });
    }

    await logActivity({
      companyId: user.companyId,
      actor: user._id,
      action: "auth.login",
      module: "auth",
      details: { email: user.email },
      ip: req.ip,
    });

    if (user.mfaEnabled) {
      const otp = crypto.randomInt(100000, 1000000).toString();
      user.otp = otp;
      user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
      await user.save();
      await sendOtpEmail({ to: user.email, name: user.name, otp, purpose: "mfa" });

      return res.status(200).json({
        status: 200,
        message: "Two-factor verification required",
        mfaRequired: true,
        userId: user._id,
        success: true,
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    return res.status(200).json({
      status: 200,
      message: "Login successful",
      token,
      user: publicUser(user),
      success: true,
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const verifyMfaOtp = async (req, res) => {
  const { userId, otp } = req.body || {};
  try {
    if (!userId || !otp) {
      return res.status(400).json(new ApiError(400, "User ID and OTP are required"));
    }
    const user = await Employee.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }
    if (!user.otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json(new ApiError(400, "OTP has expired. Please sign in again."));
    }
    if (String(user.otp) !== String(otp).trim()) {
      return res.status(400).json(new ApiError(400, "Invalid OTP. Please try again."));
    }

    user.otp = null;
    user.otpExpiresAt = null;
    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    return res.status(200).json({
      status: 200,
      message: "Verification successful",
      token,
      user: publicUser(user),
      success: true,
    });
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body || {};
  try {
    if (!email || !isValidEmail(email)) {
      return res.status(400).json(new ApiError(400, "Valid email is required"));
    }
    const user = await Employee.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(200).json(new ApiResponse(200, null, "If that email exists, a reset code has been sent."));
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await user.save();

    await sendOtpEmail({ to: user.email, name: user.name, otp, purpose: "password" });

    await logActivity({
      companyId: user.companyId,
      actor: user._id,
      action: "auth.forgot_password",
      module: "auth",
      details: { email: user.email },
      ip: req.ip,
    });

    return res.status(200).json(new ApiResponse(200, { userId: user._id }, "Reset code sent to your email."));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body || {};
  try {
    if (!email || !otp) {
      return res.status(400).json(new ApiError(400, "Email and OTP are required"));
    }
    const user = await Employee.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(400).json(new ApiError(400, "Invalid request"));
    }
    if (!user.otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json(new ApiError(400, "OTP has expired. Please request a new code."));
    }
    if (String(user.otp) !== String(otp).trim()) {
      return res.status(400).json(new ApiError(400, "Invalid OTP. Please try again."));
    }

    const resetToken = jwt.sign({ purpose: "reset", id: user._id }, JWT_SECRET, { expiresIn: "15m" });
    return res.status(200).json(new ApiResponse(200, { resetToken }, "OTP verified. You can now reset your password."));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const resetPassword = async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body || {};
  try {
    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json(new ApiError(400, "All fields are required"));
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json(new ApiError(400, "Passwords do not match"));
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json(new ApiError(400, "Password must be at least 6 characters"));
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, JWT_SECRET);
    } catch {
      return res.status(400).json(new ApiError(400, "Reset link is invalid or has expired"));
    }
    if (payload?.purpose !== "reset" || !payload?.id) {
      return res.status(400).json(new ApiError(400, "Invalid reset token"));
    }

    const user = await Employee.findById(payload.id);
    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpiresAt = null;
    user.passwordChangedAt = new Date();
    await user.save();

    await logActivity({
      companyId: user.companyId,
      actor: user._id,
      action: "auth.password_reset",
      module: "auth",
      details: { email: user.email },
      ip: req.ip,
    });

    return res.status(200).json(new ApiResponse(200, null, "Password reset successfully. You can now sign in."));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};
  try {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json(new ApiError(400, "All fields are required"));
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json(new ApiError(400, "Passwords do not match"));
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json(new ApiError(400, "Password must be at least 6 characters"));
    }

    const user = await Employee.findById(req.user.id);
    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json(new ApiError(400, "Current password is incorrect"));
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = new Date();
    await user.save();

    await logActivity({
      companyId: user.companyId,
      actor: user._id,
      action: "auth.password_changed",
      module: "auth",
      ip: req.ip,
    });

    return res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const toggleMfa = async (req, res) => {
  try {
    const user = await Employee.findById(req.user.id);
    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }
    user.mfaEnabled = !user.mfaEnabled;
    await user.save();
    await logActivity({
      companyId: user.companyId,
      actor: user._id,
      action: user.mfaEnabled ? "auth.mfa_enabled" : "auth.mfa_disabled",
      module: "auth",
      ip: req.ip,
    });
    return res.status(200).json(new ApiResponse(200, { mfaEnabled: user.mfaEnabled }, `Two-factor authentication ${user.mfaEnabled ? "enabled" : "disabled"}`));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await Employee.findById(req.user.id)
      .select("-password -otp -otpExpiresAt -emailVerificationToken -salaryHistory")
      .populate("department", "name description");
    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }
    return res.status(200).json(new ApiResponse(200, user, "Profile fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateProfile = async (req, res) => {
  const allowed = ["name", "phone", "address", "designation", "profileImg", "workLocation", "skills"];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  if (update.name !== undefined && !String(update.name).trim()) {
    return res.status(400).json(new ApiError(400, "Name cannot be empty"));
  }
  if (update.workLocation !== undefined) {
    const valid = ["on-site", "hybrid", "Remote", "Office"];
    if (!valid.includes(update.workLocation)) {
      return res.status(400).json(new ApiError(400, "Invalid work location"));
    }
  }
  try {
    const user = await Employee.findByIdAndUpdate(req.user.id, update, { new: true })
      .select("-password -otp -otpExpiresAt -emailVerificationToken -salaryHistory");
    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }
    await logActivity({
      companyId: user.companyId,
      actor: user._id,
      action: "profile.updated",
      module: "profile",
      ip: req.ip,
    });
    return res.status(200).json(new ApiResponse(200, user, "Profile updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const EmployeeAllInfo = async (req, res, io) => {
  try {
    const { search = "", page = 1, limit = 50, role: roleFilter, status: statusFilter } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const matchStage = {};

    if (req.companyId) matchStage.companyId = req.companyId;
    if (roleFilter) matchStage.role = roleFilter;
    if (statusFilter) matchStage.status = statusFilter;
    if (search) {
      const re = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      matchStage.$or = [
        { name: re },
        { email: re },
        { employeeId: re },
        { designation: re },
        { skills: re },
      ];
    }

    const [data, total] = await Promise.all([
      Employee.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: "departments",
            localField: "department",
            foreignField: "_id",
            as: "DepartmentDetails",
          },
        },
        { $unwind: { path: "$DepartmentDetails", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            password: 0,
            otp: 0,
            otpExpiresAt: 0,
            emailVerificationToken: 0,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum },
      ]),
      Employee.countDocuments(matchStage),
    ]);

    if (io) {
      io.emit("All_Employee_Info_Response", {
        message: "All employees retrieved",
        count: data.length,
        data,
      });
    }

    return res.status(200).json(
      new ApiResponse(200, { data, total, page: pageNum, limit: limitNum }, "All employees fetched successfully")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const EmployeeOneInfo = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ status: 400, message: "Invalid user ID format", success: false });
  }

  try {
    const query = { _id: id };
    if (req.companyId) query.companyId = req.companyId;

    const data = await Employee.findOne(query)
      .select("-password -otp -otpExpiresAt -emailVerificationToken -salaryHistory")
      .populate("department", "name description");
    if (!data) {
      return res.status(404).json({ status: 404, message: "Employee not found", success: false });
    }

    return res.status(200).json(new ApiResponse(200, data, "Employee fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const EmployeeInfoUpdate = async (req, res, io) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json(new ApiError(400, "Invalid user ID format"));
  }
  const allowed = [
    "name", "email", "role", "department", "designation", "skills",
    "status", "workLocation", "phone", "address", "profileImg",
    "joiningDate", "salary", "Sick", "Casual", "Unpaid",
  ];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  if (update.email !== undefined && !isValidEmail(update.email)) {
    return res.status(400).json(new ApiError(400, "Invalid email address"));
  }
  if (update.status !== undefined && !["Active", "Inactive"].includes(update.status)) {
    return res.status(400).json(new ApiError(400, "Invalid status"));
  }

  try {
    const data = await Employee.findOneAndUpdate(
      { _id: id, ...(req.companyId ? { companyId: req.companyId } : {}) },
      update,
      { new: true }
    ).select("-password -otp -otpExpiresAt -emailVerificationToken -salaryHistory");

    if (!data) {
      return res.status(404).json(new ApiError(404, "Employee not found"));
    }

    if (io) {
      io.emit("All_Employee_Info_Update", {
        message: "Employee updated",
        data,
      });
    }

    await logActivity({
      companyId: data.companyId || req.companyId,
      actor: req.user?.id,
      action: "employee.updated",
      module: "employee",
      targetType: "Employee",
      targetId: data._id,
      details: { name: data.name },
      ip: req.ip,
    });

    return res.status(200).json(new ApiResponse(200, data, "Employee updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const EmployeeInfoDeleted = async (req, res, io) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json(new ApiError(400, "Invalid user ID format"));
  }

  try {
    const data = await Employee.findOneAndDelete({
      _id: id,
      ...(req.companyId ? { companyId: req.companyId } : {}),
    });

    if (!data) {
      return res.status(404).json(new ApiError(404, "Employee not found"));
    }

    if (io) {
      io.emit("All_Employee_Info_Deleted", {
        message: "Employee deleted",
        id,
      });
    }

    await logActivity({
      companyId: data.companyId || req.companyId,
      actor: req.user?.id,
      action: "employee.deleted",
      module: "employee",
      targetType: "Employee",
      targetId: data._id,
      details: { email: data.email },
      ip: req.ip,
    });

    return res.status(200).json(new ApiResponse(200, data, "Employee deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getEmployeeStats = async (req, res) => {
  try {
    const match = req.companyId ? { companyId: req.companyId } : {};
    const [total, active, departments] = await Promise.all([
      Employee.countDocuments(match),
      Employee.countDocuments({ ...match, status: "Active" }),
      Employee.distinct("department", match),
    ]);
    const byRole = await Employee.aggregate([
      { $match: match },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          total,
          active,
          departments: departments.filter(Boolean).length,
          byRole: Object.fromEntries(byRole.map((r) => [r._id, r.count])),
        },
        "Employee stats fetched"
      )
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getEmployeeDirectory = async (req, res) => {
  try {
    const match = req.companyId ? { companyId: req.companyId, status: "Active" } : { status: "Active" };
    const data = await Employee.find(match)
      .select("name email role designation profileImg employeeId department workLocation online presence lastActive")
      .populate("department", "name")
      .sort({ name: 1 });
    return res.status(200).json(new ApiResponse(200, data, "Employee directory fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
