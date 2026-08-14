import Onboarding from "../model/Onboarding.model.js";
import { Employee } from "../model/Employee.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const isOwnCompany = async (req, employeeId) => {
  if (!req.companyId) return true;
  const emp = await Employee.findById(employeeId).select("companyId");
  return emp && String(emp.companyId) === String(req.companyId);
};

export const CreateOnboarding = async (req, res) => {
  try {
    const { employee, orientationDate, assignedHR, notes } = req.body;
    if (!employee) {
      return res.status(400).json(new ApiError(400, "Employee is required"));
    }
    if (!(await isOwnCompany(req, employee))) {
      return res.status(403).json(new ApiError(403, "Employee does not belong to your company"));
    }
    const existing = await Onboarding.findOne({ employee });
    if (existing) {
      return res.status(400).json(new ApiError(400, "Onboarding record already exists for this employee"));
    }
    const data = await Onboarding.create({
      employee,
      orientationDate,
      assignedHR: assignedHR || req.user.id,
      notes,
    });
    return res.status(201).json(new ApiResponse(201, data, "Onboarding created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const GetAllOnboarding = async (req, res) => {
  try {
    let filter = {};
    if (req.companyId) {
      const employees = await Employee.find({ companyId: req.companyId }).select("_id");
      filter = { employee: { $in: employees.map((e) => e._id) } };
    }
    const data = await Onboarding.find(filter)
      .populate("employee", "name email employeeId role")
      .populate("assignedHR", "name email")
      .sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, data, "All onboarding records fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const GetOneOnboarding = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Onboarding.findById(id)
      .populate("employee", "name email employeeId role")
      .populate("assignedHR", "name email");
    if (!data) {
      return res.status(404).json(new ApiError(404, "Onboarding record not found"));
    }
    if (!(await isOwnCompany(req, data.employee))) {
      return res.status(403).json(new ApiError(403, "Not authorized"));
    }
    return res.status(200).json(new ApiResponse(200, data, "Onboarding record fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const UpdateOnboarding = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Onboarding.findById(id);
    if (!existing) {
      return res.status(404).json(new ApiError(404, "Onboarding record not found"));
    }
    if (!(await isOwnCompany(req, existing.employee))) {
      return res.status(403).json(new ApiError(403, "Not authorized"));
    }
    const update = req.body;
    if (update.employee && !(await isOwnCompany(req, update.employee))) {
      return res.status(403).json(new ApiError(403, "Employee does not belong to your company"));
    }
    const data = await Onboarding.findByIdAndUpdate(id, update, { new: true });
    return res.status(200).json(new ApiResponse(200, data, "Onboarding updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const DeleteOnboarding = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Onboarding.findById(id);
    if (!existing) {
      return res.status(404).json(new ApiError(404, "Onboarding record not found"));
    }
    if (!(await isOwnCompany(req, existing.employee))) {
      return res.status(403).json(new ApiError(403, "Not authorized"));
    }
    const data = await Onboarding.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200, data, "Onboarding deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const UpdateDocumentStatus = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const { status, notes } = req.body;
    const onboarding = await Onboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json(new ApiError(404, "Onboarding record not found"));
    }
    if (!(await isOwnCompany(req, onboarding.employee))) {
      return res.status(403).json(new ApiError(403, "Not authorized"));
    }
    const doc = onboarding.documents.id(docId);
    if (!doc) {
      return res.status(404).json(new ApiError(404, "Document not found"));
    }
    doc.status = status || doc.status;
    if (notes !== undefined) doc.notes = notes;
    await onboarding.save();
    return res.status(200).json(new ApiResponse(200, onboarding, "Document status updated"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const UpdateSystemAccessStatus = async (req, res) => {
  try {
    const { id, accessId } = req.params;
    const { status, notes } = req.body;
    const onboarding = await Onboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json(new ApiError(404, "Onboarding record not found"));
    }
    if (!(await isOwnCompany(req, onboarding.employee))) {
      return res.status(403).json(new ApiError(403, "Not authorized"));
    }
    const access = onboarding.systemAccess.id(accessId);
    if (!access) {
      return res.status(404).json(new ApiError(404, "System access record not found"));
    }
    access.status = status || access.status;
    if (notes !== undefined) access.notes = notes;
    await onboarding.save();
    return res.status(200).json(new ApiResponse(200, onboarding, "System access status updated"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const UpdateWelcomeKitStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, items, notes } = req.body;
    const onboarding = await Onboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json(new ApiError(404, "Onboarding record not found"));
    }
    if (!(await isOwnCompany(req, onboarding.employee))) {
      return res.status(403).json(new ApiError(403, "Not authorized"));
    }
    if (status) onboarding.welcomeKit.status = status;
    if (items !== undefined) onboarding.welcomeKit.items = items;
    if (notes !== undefined) onboarding.welcomeKit.notes = notes;
    await onboarding.save();
    return res.status(200).json(new ApiResponse(200, onboarding, "Welcome kit status updated"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
