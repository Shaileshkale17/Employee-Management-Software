import Application from "../model/Application.model.js";
import Candidate from "../model/Candidate.model.js";
import Job from "../model/Job.model.js";
import { Company } from "../model/Company.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { sendEmail } from "../utils/mailService.js";
import { notify } from "../utils/notificationService.js";

const normalize = (val) =>
  Array.isArray(val)
    ? val
    : String(val || "").split(",").map((s) => s.trim()).filter(Boolean);

const buildFilters = async (query, companyId) => {
  const filter = { companyId };
  if (query.status) filter.status = query.status;
  if (query.job) filter.job = query.job;
  if (query.search) {
    const re = new RegExp(query.search, "i");
    const matchingCandidates = await Candidate.find({
      companyId,
      $or: [
        { firstName: re },
        { lastName: re },
        { email: re },
        { phone: re },
        { skills: re },
      ],
    }).select("_id");
    const ids = matchingCandidates.map((c) => c._id);
    filter.$or = [{ candidate: { $in: ids } }, { notes: re }];
  }
  return filter;
};

export const applyToJob = async (req, res) => {
  const io = req.io;
  try {
    const { slug } = req.params;
    const {
      firstName, lastName, email, phone, experience, skills,
      education, linkedin, portfolio, coverLetter,
    } = req.body || {};

    if (!firstName || !lastName || !email) {
      return res.status(400).json(new ApiError(400, "Name and email are required"));
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json(new ApiError(400, "Invalid email address"));
    }

    const company = await Company.findOne({ slug });
    if (!company) return res.status(404).json(new ApiError(404, "Company not found"));

    const job = await Job.findOne({ _id: req.params.jobId, companyId: company._id, status: "Active" });
    if (!job) return res.status(404).json(new ApiError(404, "Job not found"));

    let candidate = await Candidate.findOne({ email, companyId: company._id });
    if (!candidate) {
      candidate = await Candidate.create({
        companyId: company._id,
        firstName,
        lastName,
        email,
        phone: phone || "",
        skills: normalize(skills),
        experience: experience || "",
        education: education || "",
        resume: req.file ? `/uploads/${req.file.filename}` : (req.body.resume || ""),
        linkedin: linkedin || "",
        portfolio: portfolio || "",
        coverLetter: coverLetter || "",
        source: "career portal",
      });
    } else if (req.file) {
      candidate.resume = `/uploads/${req.file.filename}`;
      candidate.coverLetter = coverLetter || candidate.coverLetter;
      candidate.linkedin = linkedin || candidate.linkedin;
      candidate.portfolio = portfolio || candidate.portfolio;
      await candidate.save();
    }

    const duplicate = await Application.findOne({
      job: job._id,
      candidate: candidate._id,
      companyId: company._id,
      status: { $ne: "Rejected" },
    });
    if (duplicate) {
      return res.status(400).json(new ApiError(400, "You have already applied for this job"));
    }

    const application = await Application.create({
      companyId: company._id,
      job: job._id,
      candidate: candidate._id,
      coverLetter: coverLetter || "",
      timeline: [{ status: "Applied", note: "Application submitted", at: new Date() }],
    });

    await Job.findByIdAndUpdate(job._id, { $inc: { applicantsCount: 1 } });

    await sendEmail({
      to: email,
      subject: `Application received - ${job.title}`,
      text: `Dear ${firstName},\n\nWe have received your application for ${job.title}. Our team will review it shortly.\n\nBest regards,\n${company.name}`,
      html: `<p>Dear ${firstName},</p><p>We have received your application for <strong>${job.title}</strong>. Our team will review it shortly.</p><p>Best regards,<br/>${company.name}</p>`,
    });

    const hrRecipients = [job.postedBy, company.admin].filter(Boolean);
    const unique = [...new Set(hrRecipients.map((r) => String(r)))];
    for (const hrId of unique) {
      await notify({
        io,
        recipient: hrId,
        recipientModel: "Employee",
        companyId: company._id,
        title: "New application",
        message: `${firstName} ${lastName} applied for ${job.title}`,
        type: "application",
        link: "/ats",
      });
    }

    return res.status(201).json(
      new ApiResponse(201, { application, candidate }, "Application submitted successfully")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const createApplication = async (req, res) => {
  try {
    const { job, candidate, appliedDate, notes, rating, status } = req.body;
    if (!job || !candidate) {
      return res.status(400).json(new ApiError(400, "Job and candidate are required"));
    }
    const data = await Application.create({
      companyId: req.companyId,
      job,
      candidate,
      appliedDate: appliedDate || new Date(),
      notes: notes || "",
      rating: rating || null,
      status: status || "Applied",
      timeline: [{ status: status || "Applied", note: notes || "Application created", by: req.user.id, at: new Date() }],
    });
    await Job.findByIdAndUpdate(job, { $inc: { applicantsCount: 1 } });
    return res.status(201).json(new ApiResponse(201, data, "Application created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const sortField = req.query.sort || "createdAt";
    const sortOrder = req.query.order === "asc" ? 1 : -1;
    const filter = await buildFilters(req.query, req.companyId);

    const [data, total] = await Promise.all([
      Application.find(filter)
        .populate("job", "title location employmentType departmentName")
        .populate("candidate")
        .sort({ [sortField]: sortOrder })
        .skip((Math.max(Number(page), 1) - 1) * Number(limit))
        .limit(Math.min(Number(limit) || 50, 200)),
      Application.countDocuments(filter),
    ]);
    return res.status(200).json(
      new ApiResponse(200, { data, total, page: Number(page) || 1 }, "Applications fetched successfully")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Application.findOne({ _id: id, companyId: req.companyId })
      .populate("job")
      .populate("candidate")
      .populate("timeline.by", "name email role");
    if (!data) return res.status(404).json(new ApiError(404, "Application not found"));
    return res.status(200).json(new ApiResponse(200, data, "Application fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateApplicationStatus = async (req, res) => {
  const io = req.io;
  try {
    const { id } = req.params;
    const { status, notes, rating } = req.body;
    const application = await Application.findOne({ _id: id, companyId: req.companyId })
      .populate("candidate")
      .populate("job")
      .populate("companyId");
    if (!application) return res.status(404).json(new ApiError(404, "Application not found"));

    const timelineEntry = {
      status: status || application.status,
      note: notes || application.notes || "",
      by: req.user.id,
      at: new Date(),
    };
    const timeline = application.timeline || [];
    if (status && status !== application.status) {
      timeline.push({ ...timelineEntry, status });
    } else if (notes && notes !== application.notes) {
      timeline.push(timelineEntry);
    }

    const data = await Application.findOneAndUpdate(
      { _id: id, companyId: req.companyId },
      { status: status || application.status, notes: notes ?? application.notes, rating: rating ?? application.rating, timeline },
      { new: true }
    );

    if (status && application.candidate) {
      const cand = application.candidate;
      const jobTitle = application.job?.title || "";
      await notify({
        io,
        recipient: cand._id,
        recipientModel: "Candidate",
        companyId: req.companyId,
        title: "Application status update",
        message: `Your application for ${jobTitle} is now: ${status}`,
        type: "application",
      });
      await sendEmail({
        to: cand.email,
        subject: `Application status update - ${jobTitle}`,
        text: `Dear ${cand.firstName},\n\nYour application for ${jobTitle} has been updated to: ${status}.\n\nBest regards`,
        html: `<p>Dear ${cand.firstName},</p><p>Your application for <strong>${jobTitle}</strong> has been updated to: <strong>${status}</strong>.</p>`,
      });
    }

    return res.status(200).json(new ApiResponse(200, data, "Application updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const addApplicationNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json(new ApiError(400, "Note is required"));
    }
    const application = await Application.findOne({ _id: id, companyId: req.companyId });
    if (!application) return res.status(404).json(new ApiError(404, "Application not found"));

    application.timeline = application.timeline || [];
    application.timeline.push({
      status: application.status,
      note,
      by: req.user.id,
      at: new Date(),
    });
    application.notes = note;
    const data = await application.save();
    return res.status(200).json(new ApiResponse(200, data, "Note added successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Application.findOneAndDelete({ _id: id, companyId: req.companyId });
    if (!data) return res.status(404).json(new ApiError(404, "Application not found"));
    await Job.findByIdAndUpdate(data.job, { $inc: { applicantsCount: -1 } });
    return res.status(200).json(new ApiResponse(200, data, "Application deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getApplicationsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const data = await Application.find({ job: jobId, companyId: req.companyId })
      .populate("candidate")
      .sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, data, "Applications fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const pipelineStats = async (req, res) => {
  try {
    const stats = await Application.aggregate([
      { $match: { companyId: req.companyId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const total = stats.reduce((acc, s) => acc + s.count, 0);
    return res.status(200).json(
      new ApiResponse(200, { pipeline: Object.fromEntries(stats.map((s) => [s._id, s.count])), total }, "Pipeline stats fetched")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
