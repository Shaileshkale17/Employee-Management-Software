import Job from "../model/Job.model.js";
import { Company } from "../model/Company.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildFilters = (query, companyId) => {
  const filter = { companyId };
  if (query.status) filter.status = query.status;
  if (query.type || query.employmentType) {
    filter.employmentType = query.type || query.employmentType;
  }
  if (query.department) filter.department = query.department;
  if (query.location) filter.location = new RegExp(escapeRegex(query.location), "i");
  if (query.experience) filter.experience = query.experience;
  if (query.search) {
    const re = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [
      { title: re },
      { description: re },
      { location: re },
      { skills: re },
      { departmentName: re },
    ];
  }
  return filter;
};

const paginate = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 12, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

export const createJob = async (req, res) => {
  try {
    const {
      title,
      department,
      departmentName,
      location,
      employmentType,
      type,
      salary,
      salaryRange,
      skills,
      experience,
      responsibilities,
      qualifications,
      description,
      openings,
      lastDate,
      status,
    } = req.body;

    if (!title || !location) {
      return res.status(400).json(new ApiError(400, "Title and location are required"));
    }

    const data = await Job.create({
      companyId: req.companyId,
      title,
      department: department || null,
      departmentName: departmentName || "",
      location,
      employmentType: employmentType || type || "Full-time",
      type: type || employmentType || "Full-time",
      salary: salary || "",
      salaryRange: salaryRange || { min: null, max: null },
      skills: Array.isArray(skills) ? skills : String(skills || "").split(",").map((s) => s.trim()).filter(Boolean),
      experience: experience || "",
      responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
      qualifications: Array.isArray(qualifications) ? qualifications : [],
      description: description || "",
      openings: openings || 1,
      lastDate: lastDate || null,
      status: status || "Active",
      postedBy: req.user.id,
    });

    return res.status(201).json(new ApiResponse(201, data, "Job created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const filter = buildFilters(req.query, req.companyId);
    const { page, limit, skip } = paginate(req.query);
    const [data, total] = await Promise.all([
      Job.find(filter)
        .populate("postedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Job.countDocuments(filter),
    ]);
    return res.status(200).json(
      new ApiResponse(200, { data, total, page, limit }, "Jobs fetched successfully")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Job.findOne({ _id: id, companyId: req.companyId }).populate(
      "postedBy", "name email"
    );
    if (!data) return res.status(404).json(new ApiError(404, "Job not found"));
    return res.status(200).json(new ApiResponse(200, data, "Job fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getPublicJobs = async (req, res) => {
  try {
    const { slug } = req.params;
    const company = await Company.findOne({ slug });
    if (!company) return res.status(404).json(new ApiError(404, "Company not found"));

    const filter = {
      companyId: company._id,
      status: "Active",
    };
    const re = (v) => new RegExp(escapeRegex(v), "i");
    if (req.query.search) {
      const s = re(req.query.search);
      filter.$or = [{ title: s }, { description: s }, { location: s }, { skills: s }, { departmentName: s }];
    }
    if (req.query.location) filter.location = re(req.query.location);
    if (req.query.department) filter.departmentName = re(req.query.department);
    if (req.query.experience) filter.experience = req.query.experience;
    if (req.query.category || req.query.type) {
      filter.employmentType = req.query.category || req.query.type;
    }

    const data = await Job.find(filter)
      .select("title departmentName location employmentType experience salary salaryRange skills description openings lastDate createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, { jobs: data, company }, "Active jobs fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getPublicJob = async (req, res) => {
  try {
    const { slug, jobId } = req.params;
    const company = await Company.findOne({ slug });
    if (!company) return res.status(404).json(new ApiError(404, "Company not found"));
    const data = await Job.findOne({
      _id: jobId,
      companyId: company._id,
      status: "Active",
    }).select("-postedBy -applicantsCount -__v");
    if (!data) return res.status(404).json(new ApiError(404, "Job not found"));
    return res.status(200).json(new ApiResponse(200, { job: data, company }, "Job fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = [
      "title", "description", "department", "departmentName", "employmentType",
      "salaryRange", "location", "status", "openings", "skills",
      "responsibilities", "postedBy", "isPublic",
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (Array.isArray(update.skills) === false && typeof update.skills === "string") {
      update.skills = update.skills.split(",").map((s) => s.trim()).filter(Boolean);
    }
    const data = await Job.findOneAndUpdate({ _id: id, companyId: req.companyId }, update, { new: true });
    if (!data) return res.status(404).json(new ApiError(404, "Job not found"));
    return res.status(200).json(new ApiResponse(200, data, "Job updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Job.findOneAndDelete({ _id: id, companyId: req.companyId });
    if (!data) return res.status(404).json(new ApiError(404, "Job not found"));
    return res.status(200).json(new ApiResponse(200, data, "Job deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const duplicateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const source = await Job.findOne({ _id: id, companyId: req.companyId });
    if (!source) return res.status(404).json(new ApiError(404, "Job not found"));

    const data = await Job.create({
      companyId: req.companyId,
      title: `${source.title} (Copy)`,
      department: source.department,
      departmentName: source.departmentName,
      location: source.location,
      employmentType: source.employmentType,
      type: source.type,
      salary: source.salary,
      salaryRange: source.salaryRange,
      skills: source.skills,
      experience: source.experience,
      responsibilities: source.responsibilities,
      qualifications: source.qualifications,
      description: source.description,
      openings: source.openings,
      lastDate: source.lastDate,
      status: "Draft",
      postedBy: req.user.id,
    });
    return res.status(201).json(new ApiResponse(201, data, "Job duplicated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const closeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Job.findOneAndUpdate(
      { _id: id, companyId: req.companyId },
      { status: "Closed", closedAt: new Date() },
      { new: true }
    );
    if (!data) return res.status(404).json(new ApiError(404, "Job not found"));
    return res.status(200).json(new ApiResponse(200, data, "Job closed successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const archiveJob = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Job.findOneAndUpdate(
      { _id: id, companyId: req.companyId },
      { status: "Archived", archivedAt: new Date() },
      { new: true }
    );
    if (!data) return res.status(404).json(new ApiError(404, "Job not found"));
    return res.status(200).json(new ApiResponse(200, data, "Job archived successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const reopenJob = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Job.findOneAndUpdate(
      { _id: id, companyId: req.companyId },
      { status: "Active", closedAt: null },
      { new: true }
    );
    if (!data) return res.status(404).json(new ApiError(404, "Job not found"));
    return res.status(200).json(new ApiResponse(200, data, "Job reactivated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
