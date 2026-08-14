import { Company } from "../model/Company.model.js";
import { Employee } from "../model/Employee.model.js";
import { Department } from "../model/Department.mode.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendEmail } from "../utils/mailService.js";
import { notify } from "../utils/notificationService.js";

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

export const createSlug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "company";

export const registerCompany = async (req, res) => {
  const {
    name,
    industry,
    size,
    website,
    address,
    gst,
    contactPerson,
    email,
    phone,
    password,
  } = req.body || {};

  try {
    if (!name || !email || !contactPerson || !password) {
      return res
        .status(400)
        .json(new ApiError(400, "Company name, email, contact person and password are required"));
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json(new ApiError(400, "Password must be at least 6 characters"));
    }

    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json(new ApiError(400, "A company with this email is already registered"));
    }
    const existingUser = await Employee.findOne({ email });
    if (existingUser) {
      return res.status(400).json(new ApiError(400, "An account with this email already exists"));
    }

    const slug = createSlug(name);
    const allowed = [
      "companyName", "email", "password", "name", "phone", "website",
      "industry", "size", "address", "description", "ownerName",
      "contactPhone", "contactEmail",
    ];
    const companyDoc = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) companyDoc[key] = req.body[key];
    }
    let company = await Company.findOne({ slug });
    if (company) {
      company = await Company.create({
        ...companyDoc,
        logo: req.file ? `/uploads/${req.file.filename}` : "",
        slug: `${slug}-${Math.floor(Math.random() * 9999)}`,
      });
    } else {
      company = await Company.create({ ...companyDoc, logo: req.file ? `/uploads/${req.file.filename}` : "", slug });
    }

    const generalDept = await Department.findOneAndUpdate(
      { name: "General", companyId: company._id },
      {
        name: "General",
        description: "General department",
        companyId: company._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const token = crypto.randomBytes(32).toString("hex");
    const employeeId = await generateEmployeeId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Employee.create({
      name: contactPerson,
      email,
      password: hashedPassword,
      role: "Company Admin",
      companyId: company._id,
      department: generalDept._id,
      employeeId,
      status: "Active",
      isEmailVerified: false,
      emailVerificationToken: token,
      salary: { ctc: 0, basic: 0, hra: 0 },
    });

    company.admin = admin._id;
    company.emailVerificationToken = token;
    await company.save();

    await sendEmail({
      to: email,
      subject: "Verify your company email",
      text: `Hello ${contactPerson}, please verify your email by clicking: ${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-company-email?token=${token}&company=${company._id}`,
      html: `<p>Hello ${contactPerson},</p><p>Please <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-company-email?token=${token}&company=${company._id}">click here</a> to verify your company email and activate your workspace.</p>`,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        { company: { _id: company._id, name: company.name, slug: company.slug }, admin: { email: admin.email, name: admin.name } },
        "Company registered successfully. Verification email sent."
      )
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const verifyCompanyEmail = async (req, res) => {
  const { token, company: companyId } = req.query;
  try {
    if (!token || !companyId) {
      return res.status(400).json(new ApiError(400, "Invalid verification link"));
    }
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json(new ApiError(404, "Company not found"));
    }
    if (company.emailVerificationToken !== token) {
      return res.status(400).json(new ApiError(400, "Invalid or expired verification token"));
    }
    company.isEmailVerified = true;
    company.emailVerificationToken = "";
    await company.save();

    await Employee.findByIdAndUpdate(company.admin, {
      isEmailVerified: true,
      emailVerificationToken: "",
    });

    return res.status(200).json(new ApiResponse(200, { companyId: company._id }, "Email verified successfully. You can now log in."));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findById(req.companyId).select("-emailVerificationToken");
    if (!company) {
      return res.status(404).json(new ApiError(404, "Company not found"));
    }
    return res.status(200).json(new ApiResponse(200, company, "Company profile fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getPublicCompany = async (req, res) => {
  try {
    const { slug } = req.params;
    const company = await Company.findOne({ slug }).select(
      "name slug logo industry website address status size"
    );
    if (!company) {
      return res.status(404).json(new ApiError(404, "Company not found"));
    }
    return res.status(200).json(new ApiResponse(200, company, "Company fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateCompany = async (req, res) => {
  try {
    const allowed = [
      "name", "industry", "size", "website", "address", "gst",
      "contactPerson", "phone", "logo",
    ];
    if (req.employee?.role === "Super Admin") allowed.push("status");
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (update.name) {
      const slug = createSlug(update.name);
      const dup = await Company.findOne({ slug, _id: { $ne: req.companyId } });
      if (!dup) update.slug = slug;
    }
    const data = await Company.findByIdAndUpdate(req.companyId, update, { new: true }).select("-emailVerificationToken");
    if (!data) return res.status(404).json(new ApiError(404, "Company not found"));
    return res.status(200).json(new ApiResponse(200, data, "Company updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getCompanyDepartments = async (req, res) => {
  try {
    const data = await Department.find({ companyId: req.companyId }).sort({ name: 1 });
    return res.status(200).json(new ApiResponse(200, data, "Departments fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json(new ApiError(400, "Department name is required"));
    }
    const existing = await Department.findOne({ name, companyId: req.companyId });
    if (existing) {
      return res.status(400).json(new ApiError(400, "Department already exists in this company"));
    }
    const data = await Department.create({ name, description, companyId: req.companyId });
    return res.status(201).json(new ApiResponse(201, data, "Department created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const companyDashboardStats = async (req, res) => {
  try {
    const { default: Job } = await import("../model/Job.model.js");
    const { default: Candidate } = await import("../model/Candidate.model.js");
    const { default: Application } = await import("../model/Application.model.js");
    const { default: Interview } = await import("../model/Interview.model.js");

    const [employees, departments, jobs, activeJobs, candidates, applications, interviews] =
      await Promise.all([
        Employee.countDocuments({ companyId: req.companyId }),
        Department.countDocuments({ companyId: req.companyId }),
        Job.countDocuments({ companyId: req.companyId }),
        Job.countDocuments({ companyId: req.companyId, status: "Active" }),
        Candidate.countDocuments({ companyId: req.companyId }),
        Application.countDocuments({ companyId: req.companyId }),
        Interview.countDocuments({ companyId: req.companyId, status: "Scheduled" }),
      ]);

    const pipeline = await Application.aggregate([
      { $match: { companyId: req.companyId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          employees,
          departments,
          jobs,
          activeJobs,
          candidates,
          applications,
          upcomingInterviews: interviews,
          pipeline: Object.fromEntries(pipeline.map((p) => [p._id, p.count])),
        },
        "Dashboard stats fetched successfully"
      )
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
