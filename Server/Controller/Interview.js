import Interview from "../model/Interview.model.js";
import CalendarEvent from "../model/CalendarEvent.model.js";
import Application from "../model/Application.model.js";
import Candidate from "../model/Candidate.model.js";
import { Employee } from "../model/Employee.model.js";
import Job from "../model/Job.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { notify } from "../utils/notificationService.js";
import { sendEmail } from "../utils/mailService.js";

export const searchEmployees = async (req, res) => {
  try {
    const { q = "", department, skill, designation } = req.query;
    const filter = { companyId: req.companyId, status: "Active" };
    const ors = [];
    if (q) {
      const re = new RegExp(q, "i");
      ors.push({ name: re }, { email: re });
    }
    if (designation) ors.push({ designation: new RegExp(designation, "i") });
    if (skill) ors.push({ skills: new RegExp(skill, "i") });
    if (department) filter.department = department;
    if (ors.length) filter.$or = ors;

    const data = await Employee.find(filter).select(
      "name email role designation skills profileImg employeeId department"
    ).populate("department", "name").limit(50);

    return res.status(200).json(new ApiResponse(200, data, "Employees fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const scheduleInterview = async (req, res) => {
  const io = req.io;
  try {
    const {
      candidate, job, application, interviewDate, duration, round,
      mode, meetingLink, panel, type, notes,
    } = req.body;

    if (!candidate || !job || !interviewDate) {
      return res.status(400).json(new ApiError(400, "Candidate, job and interview date are required"));
    }

    const panelList = Array.isArray(panel) ? panel.filter(Boolean) : [];
    const interviewDoc = {
      companyId: req.companyId,
      candidate,
      job,
      interviewDate,
      duration: duration || 60,
      round: round || "Round 1",
      mode: mode || "Video Call",
      meetingLink: meetingLink || "",
      panel: panelList,
      type: type || "Technical",
      notes: notes || "",
      status: "Scheduled",
      scheduledBy: req.user.id,
    };
    if (application) interviewDoc.application = application;
    const data = await Interview.create(interviewDoc);

    const start = new Date(interviewDate);
    const end = new Date(start.getTime() + (duration || 60) * 60000);

    const [cand, jobDoc] = await Promise.all([
      Candidate.findById(candidate).select("firstName lastName email phone"),
      Job.findById(job).select("title"),
    ]);

    const attendees = new Set([req.user.id, ...panelList]);

    const event = await CalendarEvent.create({
      company: req.companyId,
      title: `Interview: ${cand?.firstName || ""} ${cand?.lastName || ""} - ${jobDoc?.title || ""}`,
      description: `${round} interview (${mode}). ${meetingLink ? `Link: ${meetingLink}` : ""}${notes ? `. Notes: ${notes}` : ""}`,
      start,
      end,
      type: "interview",
      link: meetingLink || "",
      interview: data._id,
      attendees: [...attendees],
      createdBy: req.user.id,
    });

    for (const empId of panelList) {
      const emp = await Employee.findById(empId).select("name email role");
      if (!emp) continue;
      await notify({
        io,
        recipient: empId,
        recipientModel: "Employee",
        companyId: req.companyId,
        title: "Interview assigned",
        message: `You have been assigned an interview: ${cand?.firstName || ""} ${cand?.lastName || ""} for ${jobDoc?.title || ""} (${round})`,
        type: "interview",
        link: "/meeting",
      });
      await sendEmail({
        to: emp.email,
        subject: `You have been assigned an interview`,
        text: `You have been assigned an interview for ${cand?.firstName || ""} ${cand?.lastName || ""} (${jobDoc?.title || ""}) on ${start.toLocaleString()}. ${meetingLink ? `Join: ${meetingLink}` : ""}`,
        html: `<p>You have been assigned an interview for <strong>${cand?.firstName || ""} ${cand?.lastName || ""}</strong> (<strong>${jobDoc?.title || ""}</strong>) on <strong>${start.toLocaleString()}</strong>.</p>${meetingLink ? `<p>Join: <a href="${meetingLink}">${meetingLink}</a></p>` : ""}`,
      });
    }

    if (cand?.email) {
      await sendEmail({
        to: cand.email,
        subject: `Interview scheduled - ${jobDoc?.title || ""}`,
        text: `Dear ${cand.firstName},\n\nYour interview for ${jobDoc?.title || ""} is scheduled on ${start.toLocaleString()} (${mode}). ${meetingLink ? `Join here: ${meetingLink}` : ""}\n\nBest regards`,
        html: `<p>Dear ${cand.firstName},</p><p>Your interview for <strong>${jobDoc?.title || ""}</strong> is scheduled on <strong>${start.toLocaleString()}</strong> (${mode}).</p>${meetingLink ? `<p>Join here: <a href="${meetingLink}">${meetingLink}</a></p>` : ""}`,
      });
    }

    if (application) {
      await Application.findByIdAndUpdate(application, {
        status: "Interview",
        $push: { timeline: { status: "Interview", note: `Interview scheduled (${round})`, by: req.user.id, at: new Date() } },
      });
    }

    return res.status(201).json(new ApiResponse(201, data, "Interview scheduled successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getAllInterviews = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = { companyId: req.companyId };
    if (status) filter.status = status;
    const [data, total] = await Promise.all([
      Interview.find(filter)
        .populate("candidate", "firstName lastName email phone resume")
        .populate("job", "title location employmentType")
        .populate("application")
        .populate("panel", "name email role designation")
        .sort({ interviewDate: -1 })
        .skip((Math.max(Number(page), 1) - 1) * Number(limit))
        .limit(Number(limit) || 50),
      Interview.countDocuments(filter),
    ]);
    return res.status(200).json(new ApiResponse(200, { data, total }, "Interviews fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getMyInterviews = async (req, res) => {
  try {
    const filter = { companyId: req.companyId, panel: req.user.id, status: "Scheduled" };
    const data = await Interview.find(filter)
      .populate("candidate", "firstName lastName email resume skills")
      .populate("job", "title location")
      .populate("panel", "name email role designation")
      .sort({ interviewDate: 1 });
    return res.status(200).json(new ApiResponse(200, data, "Your interviews fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Interview.findOne({ _id: id, companyId: req.companyId })
      .populate("candidate")
      .populate("job")
      .populate("application")
      .populate("panel", "name email role designation");
    if (!data) return res.status(404).json(new ApiError(404, "Interview not found"));
    return res.status(200).json(new ApiResponse(200, data, "Interview fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateInterview = async (req, res) => {
  const io = req.io;
  try {
    const { id } = req.params;
    const { status, interviewDate, mode, location, panel, notes } = req.body;

    const existing = await Interview.findOne({ _id: id, companyId: req.companyId })
      .populate("candidate", "firstName lastName email")
      .populate("job", "title");
    if (!existing) return res.status(404).json(new ApiError(404, "Interview not found"));

    const update = {};
    if (status !== undefined) update.status = status;
    if (interviewDate !== undefined) update.interviewDate = interviewDate;
    if (mode !== undefined) update.mode = mode;
    if (location !== undefined) update.location = location;
    if (panel !== undefined) update.panel = Array.isArray(panel) ? panel.filter(Boolean) : panel;
    if (notes !== undefined) update.notes = notes;

    const data = await Interview.findOneAndUpdate(
      { _id: id, companyId: req.companyId },
      update,
      { new: true }
    );

    if (status === "Cancelled") {
      await CalendarEvent.deleteMany({ interview: id });
      for (const empId of existing.panel || []) {
        await notify({
          io,
          recipient: empId,
          recipientModel: "Employee",
          companyId: req.companyId,
          title: "Interview cancelled",
          message: `The interview for ${existing.candidate?.firstName || ""} (${existing.job?.title || ""}) has been cancelled`,
          type: "interview",
          link: "/meeting",
        });
      }
    }

    return res.status(200).json(new ApiResponse(200, data, "Interview updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const deleteInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Interview.findOneAndDelete({ _id: id, companyId: req.companyId });
    if (!data) return res.status(404).json(new ApiError(404, "Interview not found"));
    await CalendarEvent.deleteMany({ interview: id });
    return res.status(200).json(new ApiResponse(200, data, "Interview deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateInterviewFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, rating, result } = req.body;
    const update = {};
    if (feedback !== undefined) update.feedback = feedback;
    if (rating !== undefined) update.rating = rating;
    if (result !== undefined) update.result = result;
    const data = await Interview.findOneAndUpdate(
      { _id: id, companyId: req.companyId },
      update,
      { new: true }
    );
    if (!data) return res.status(404).json(new ApiError(404, "Interview not found"));
    return res.status(200).json(new ApiResponse(200, data, "Interview feedback updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
