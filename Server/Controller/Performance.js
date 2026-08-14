import { Performance } from "../model/Performance.model.js";
import { Employee } from "../model/Employee.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const isOwnCompany = async (req, employeeId) => {
  if (!req.companyId) return true;
  const emp = await Employee.findById(employeeId).select("companyId");
  return emp && String(emp.companyId) === String(req.companyId);
};

const withPeople = (q) =>
  q
    .populate("employee", "name email employeeId department designation")
    .populate("reviewer", "name email");

export const CreatePerformance = async (req, res) => {
  try {
    const { employee, type, title } = req.body;
    if (!employee) return res.status(400).json(new ApiError(400, "Employee is required"));
    if (!type) return res.status(400).json(new ApiError(400, "Type is required"));
    if (!title) return res.status(400).json(new ApiError(400, "Title is required"));
    if (!(await isOwnCompany(req, employee))) {
      return res.status(403).json(new ApiError(403, "Employee does not belong to your company"));
    }
    if (req.body.reviewer && !(await isOwnCompany(req, req.body.reviewer))) {
      return res.status(403).json(new ApiError(403, "Reviewer does not belong to your company"));
    }
    const data = await Performance.create({
      ...req.body,
      rating: req.body.rating ? Number(req.body.rating) : undefined,
      progress: req.body.progress !== undefined ? Number(req.body.progress) : 0,
    });
    return res.status(201).json(new ApiResponse(201, data, "Performance record created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const GetAllPerformance = async (req, res) => {
  try {
    const { type, search } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (req.companyId) {
      const employees = await Employee.find({ companyId: req.companyId }).select("_id");
      filter.employee = { $in: employees.map((e) => e._id) };
    }
    if (search) {
      const employees = await Employee.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { fromRole: { $regex: search, $options: "i" } },
        { toRole: { $regex: search, $options: "i" } },
        { employee: { $in: employees.map((e) => e._id) } },
      ];
    }
    const data = await withPeople(Performance.find(filter)).sort({ updatedAt: -1 });
    return res.status(200).json(new ApiResponse(200, data, "Performance records fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const GetOnePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await withPeople(Performance.findById(id));
    if (!data) return res.status(404).json(new ApiError(404, "Performance record not found"));
    if (!(await isOwnCompany(req, data.employee))) return res.status(403).json(new ApiError(403, "Not authorized"));
    return res.status(200).json(new ApiResponse(200, data, "Performance record fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const UpdatePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Performance.findById(id);
    if (!existing) return res.status(404).json(new ApiError(404, "Performance record not found"));
    if (!(await isOwnCompany(req, existing.employee))) return res.status(403).json(new ApiError(403, "Not authorized"));
    const update = { ...req.body };
    if (update.employee && !(await isOwnCompany(req, update.employee))) {
      return res.status(403).json(new ApiError(403, "Employee does not belong to your company"));
    }
    if (update.reviewer && !(await isOwnCompany(req, update.reviewer))) {
      return res.status(403).json(new ApiError(403, "Reviewer does not belong to your company"));
    }
    if (update.rating !== undefined) update.rating = Number(update.rating);
    if (update.progress !== undefined) update.progress = Number(update.progress);
    const data = await Performance.findByIdAndUpdate(id, update, { new: true });
    return res.status(200).json(new ApiResponse(200, data, "Performance record updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const DeletePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Performance.findById(id);
    if (!existing) return res.status(404).json(new ApiError(404, "Performance record not found"));
    if (!(await isOwnCompany(req, existing.employee))) return res.status(403).json(new ApiError(403, "Not authorized"));
    const data = await Performance.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200, data, "Performance record deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
