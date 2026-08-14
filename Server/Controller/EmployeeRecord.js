import EmployeeRecord from "../model/EmployeeRecord.model.js";
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
  q
    .populate("employee", "name email employeeId department designation")
    .populate("updatedBy", "name email");

export const CreateEmployeeRecord = async (req, res) => {
  try {
    const { employee, category, title } = req.body;
    if (!employee) return res.status(400).json(new ApiError(400, "Employee is required"));
    if (!category) return res.status(400).json(new ApiError(400, "Category is required"));
    if (!title) return res.status(400).json(new ApiError(400, "Title is required"));
    if (!(await isOwnCompany(req, employee))) {
      return res.status(403).json(new ApiError(403, "Employee does not belong to your company"));
    }
    const data = await EmployeeRecord.create({ ...req.body, updatedBy: req.user.id });
    return res.status(201).json(new ApiResponse(201, data, "Employee record created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const GetAllEmployeeRecords = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
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
        { employee: { $in: employees.map((e) => e._id) } },
      ];
    }
    const data = await withPeople(
      EmployeeRecord.find(filter)
    ).sort({ updatedAt: -1 });
    return res.status(200).json(new ApiResponse(200, data, "Employee records fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const GetOneEmployeeRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await withPeople(EmployeeRecord.findById(id));
    if (!data) return res.status(404).json(new ApiError(404, "Employee record not found"));
    if (!(await isOwnCompany(req, data.employee))) return res.status(403).json(new ApiError(403, "Not authorized"));
    return res.status(200).json(new ApiResponse(200, data, "Employee record fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const UpdateEmployeeRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await EmployeeRecord.findById(id);
    if (!existing) return res.status(404).json(new ApiError(404, "Employee record not found"));
    if (!(await isOwnCompany(req, existing.employee))) return res.status(403).json(new ApiError(403, "Not authorized"));
    const update = { ...req.body, updatedBy: req.user.id };
    if (update.employee && !(await isOwnCompany(req, update.employee))) {
      return res.status(403).json(new ApiError(403, "Employee does not belong to your company"));
    }
    const data = await EmployeeRecord.findByIdAndUpdate(id, update, { new: true });
    return res.status(200).json(new ApiResponse(200, data, "Employee record updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const DeleteEmployeeRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await EmployeeRecord.findById(id);
    if (!existing) return res.status(404).json(new ApiError(404, "Employee record not found"));
    if (!(await isOwnCompany(req, existing.employee))) return res.status(403).json(new ApiError(403, "Not authorized"));
    const data = await EmployeeRecord.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200, data, "Employee record deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
