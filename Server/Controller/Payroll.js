import { Payroll } from "../model/Payroll.model.js";
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

export const CreatePayroll = async (req, res) => {
  try {
    const { employee, type, amount } = req.body;
    if (!employee) return res.status(400).json(new ApiError(400, "Employee is required"));
    if (!type) return res.status(400).json(new ApiError(400, "Type is required"));
    if (amount === undefined || Number(amount) < 0) {
      return res.status(400).json(new ApiError(400, "Valid amount is required"));
    }
    if (!(await isOwnCompany(req, employee))) {
      return res.status(403).json(new ApiError(403, "Employee does not belong to your company"));
    }
    const data = await Payroll.create({ ...req.body, amount: Number(amount) });
    return res.status(201).json(new ApiResponse(201, data, "Payroll record created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const GetAllPayroll = async (req, res) => {
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
        { period: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { employee: { $in: employees.map((e) => e._id) } },
      ];
    }
    const data = await withPeople(Payroll.find(filter)).sort({ updatedAt: -1 });
    return res.status(200).json(new ApiResponse(200, data, "Payroll records fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const GetOnePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await withPeople(Payroll.findById(id));
    if (!data) return res.status(404).json(new ApiError(404, "Payroll record not found"));
    if (!(await isOwnCompany(req, data.employee))) return res.status(403).json(new ApiError(403, "Not authorized"));
    return res.status(200).json(new ApiResponse(200, data, "Payroll record fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const UpdatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Payroll.findById(id);
    if (!existing) return res.status(404).json(new ApiError(404, "Payroll record not found"));
    if (!(await isOwnCompany(req, existing.employee))) return res.status(403).json(new ApiError(403, "Not authorized"));
    const update = { ...req.body };
    if (update.employee && !(await isOwnCompany(req, update.employee))) {
      return res.status(403).json(new ApiError(403, "Employee does not belong to your company"));
    }
    if (update.amount !== undefined) update.amount = Number(update.amount);
    const data = await Payroll.findByIdAndUpdate(id, update, { new: true });
    return res.status(200).json(new ApiResponse(200, data, "Payroll record updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const DeletePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Payroll.findById(id);
    if (!existing) return res.status(404).json(new ApiError(404, "Payroll record not found"));
    if (!(await isOwnCompany(req, existing.employee))) return res.status(403).json(new ApiError(403, "Not authorized"));
    const data = await Payroll.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200, data, "Payroll record deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
