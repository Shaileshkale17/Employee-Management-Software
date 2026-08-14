import { FinanceCoordination } from "../model/FinanceCoordination.model.js";
import { Employee } from "../model/Employee.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const isOwnCompany = async (req, employeeId) => {
  if (!employeeId) return true;
  if (!req.companyId) return true;
  const emp = await Employee.findById(employeeId).select("companyId");
  return emp && String(emp.companyId) === String(req.companyId);
};

const withPeople = (q) =>
  q.populate("employee", "name email employeeId department designation");

export const CreateFinanceCoordination = async (req, res) => {
  try {
    if (req.body.employee && !(await isOwnCompany(req, req.body.employee))) {
      return res.status(403).json(new ApiError(403, "Employee does not belong to your company"));
    }
    const data = await FinanceCoordination.create({
      ...req.body,
      amount: Number(req.body.amount || 0),
    });
    return res.status(201).json(new ApiResponse(201, data, "Finance record created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const GetAllFinanceCoordination = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
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
        { recordType: { $regex: search, $options: "i" } },
        { period: { $regex: search, $options: "i" } },
        { financeContact: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { employee: { $in: employees.map((e) => e._id) } },
      ];
    }
    const data = await withPeople(FinanceCoordination.find(filter)).sort({ updatedAt: -1 });
    return res.status(200).json(new ApiResponse(200, data, "Finance records fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const GetOneFinanceCoordination = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await withPeople(FinanceCoordination.findById(id));
    if (!data) return res.status(404).json(new ApiError(404, "Finance record not found"));
    if (!(await isOwnCompany(req, data.employee))) return res.status(403).json(new ApiError(403, "Not authorized"));
    return res.status(200).json(new ApiResponse(200, data, "Finance record fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const UpdateFinanceCoordination = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await FinanceCoordination.findById(id);
    if (!existing) return res.status(404).json(new ApiError(404, "Finance record not found"));
    if (!(await isOwnCompany(req, existing.employee))) return res.status(403).json(new ApiError(403, "Not authorized"));
    const update = { ...req.body };
    if (update.employee && !(await isOwnCompany(req, update.employee))) {
      return res.status(403).json(new ApiError(403, "Employee does not belong to your company"));
    }
    if (update.amount !== undefined) update.amount = Number(update.amount);
    const data = await FinanceCoordination.findByIdAndUpdate(id, update, { new: true });
    return res.status(200).json(new ApiResponse(200, data, "Finance record updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const DeleteFinanceCoordination = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await FinanceCoordination.findById(id);
    if (!existing) return res.status(404).json(new ApiError(404, "Finance record not found"));
    if (!(await isOwnCompany(req, existing.employee))) return res.status(403).json(new ApiError(403, "Not authorized"));
    const data = await FinanceCoordination.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200, data, "Finance record deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
