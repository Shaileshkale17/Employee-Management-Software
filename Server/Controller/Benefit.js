import { Benefit } from "../model/Benefit.model.js";
import { Employee } from "../model/Employee.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const isOwnCompany = async (req, employeeId) => {
  if (!req.companyId) return true;
  const emp = await Employee.findById(employeeId).select("companyId");
  return emp && String(emp.companyId) === String(req.companyId);
};

const withPeople = (q) =>
  q.populate("employee", "name email employeeId department designation");

export const CreateBenefit = async (req, res) => {
  try {
    const { employee, type } = req.body;
    if (!employee) return res.status(400).json(new ApiError(400, "Employee is required"));
    if (!type) return res.status(400).json(new ApiError(400, "Benefit type is required"));
    if (!(await isOwnCompany(req, employee))) {
      return res.status(403).json(new ApiError(403, "Employee does not belong to your company"));
    }
    const data = await Benefit.create({
      ...req.body,
      amount: Number(req.body.amount || 0),
      coverage: Number(req.body.coverage || 0),
    });
    return res.status(201).json(new ApiResponse(201, data, "Benefit record created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const GetAllBenefits = async (req, res) => {
  try {
    const { type, status, search } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (req.companyId) {
      const employees = await Employee.find({ companyId: req.companyId }).select("_id");
      filter.employee = { $in: employees.map((e) => e._id) };
    }
    if (search) {
      const employees = await Employee.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      filter.$or = [
        { planName: { $regex: search, $options: "i" } },
        { provider: { $regex: search, $options: "i" } },
        { policyNumber: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { employee: { $in: employees.map((e) => e._id) } },
      ];
    }
    const data = await withPeople(Benefit.find(filter)).sort({ updatedAt: -1 });
    return res.status(200).json(new ApiResponse(200, data, "Benefit records fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const GetOneBenefit = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await withPeople(Benefit.findById(id));
    if (!data) return res.status(404).json(new ApiError(404, "Benefit record not found"));
    if (!(await isOwnCompany(req, data.employee))) return res.status(403).json(new ApiError(403, "Not authorized"));
    return res.status(200).json(new ApiResponse(200, data, "Benefit record fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const UpdateBenefit = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Benefit.findById(id);
    if (!existing) return res.status(404).json(new ApiError(404, "Benefit record not found"));
    if (!(await isOwnCompany(req, existing.employee))) return res.status(403).json(new ApiError(403, "Not authorized"));
    const update = { ...req.body };
    if (update.employee && !(await isOwnCompany(req, update.employee))) {
      return res.status(403).json(new ApiError(403, "Employee does not belong to your company"));
    }
    if (update.amount !== undefined) update.amount = Number(update.amount);
    if (update.coverage !== undefined) update.coverage = Number(update.coverage);
    const data = await Benefit.findByIdAndUpdate(id, update, { new: true });
    return res.status(200).json(new ApiResponse(200, data, "Benefit record updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const DeleteBenefit = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Benefit.findById(id);
    if (!existing) return res.status(404).json(new ApiError(404, "Benefit record not found"));
    if (!(await isOwnCompany(req, existing.employee))) return res.status(403).json(new ApiError(403, "Not authorized"));
    const data = await Benefit.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200, data, "Benefit record deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
