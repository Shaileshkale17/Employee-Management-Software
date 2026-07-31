import Candidate from "../model/Candidate.model.js";
import Application from "../model/Application.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const normalize = (val) =>
  Array.isArray(val)
    ? val
    : String(val || "").split(",").map((s) => s.trim()).filter(Boolean);

export const createCandidate = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, skills, experience,
      education, resume, linkedin, portfolio, coverLetter, source, notes,
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json(new ApiError(400, "First name, last name and email are required"));
    }
    const existing = await Candidate.findOne({ email, companyId: req.companyId });
    if (existing) {
      return res.status(200).json(new ApiResponse(200, existing, "Candidate already exists"));
    }

    const data = await Candidate.create({
      companyId: req.companyId,
      firstName, lastName, email, phone: phone || "",
      skills: normalize(skills),
      experience: experience || "",
      education: education || "",
      resume: resume || "",
      linkedin: linkedin || "",
      portfolio: portfolio || "",
      coverLetter: coverLetter || "",
      source: source || "manual",
      notes: notes || "",
    });
    return res.status(201).json(new ApiResponse(201, data, "Candidate created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getAllCandidates = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);
    const filter = { companyId: req.companyId };
    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [
        { firstName: re },
        { lastName: re },
        { email: re },
        { skills: re },
      ];
    }
    const [data, total] = await Promise.all([
      Candidate.find(filter)
        .sort({ createdAt: -1 })
        .skip((Math.max(Number(page), 1) - 1) * safeLimit)
        .limit(safeLimit),
      Candidate.countDocuments(filter),
    ]);
    return res.status(200).json(new ApiResponse(200, { data, total }, "Candidates fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Candidate.findOne({ _id: id, companyId: req.companyId });
    if (!data) return res.status(404).json(new ApiError(404, "Candidate not found"));
    const applications = await Application.find({ candidate: id, companyId: req.companyId })
      .sort({ createdAt: -1 })
      .populate("job", "title location employmentType");
    return res.status(200).json(new ApiResponse(200, { ...data.toObject(), applications }, "Candidate fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ["name", "email", "phone", "position", "source", "status", "notes", "resumeUrl"];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const data = await Candidate.findOneAndUpdate({ _id: id, companyId: req.companyId }, update, { new: true });
    if (!data) return res.status(404).json(new ApiError(404, "Candidate not found"));
    return res.status(200).json(new ApiResponse(200, data, "Candidate updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Candidate.findOneAndDelete({ _id: id, companyId: req.companyId });
    if (!data) return res.status(404).json(new ApiError(404, "Candidate not found"));
    return res.status(200).json(new ApiResponse(200, data, "Candidate deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
