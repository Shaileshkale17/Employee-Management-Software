import mongoose from "mongoose";
import { Department } from "../model/Department.mode.js";
import { Employee } from "../model/Employee.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Notification } from "../model/Notification.model.js";
import { logActivity } from "../utils/activityLogger.js";

export const createDepartment = async (req, res) => {
  try {
    const { name, description, employeeId } = req.body;
    if ([name, description].some((f) => !f || f.trim() === "")) {
      return res
        .status(400)
        .json(new ApiError(400, "Name and description fields are required"));
    }
    const existingDepartment = await Department.findOne({
      name: name.trim(),
      companyId: req.companyId,
    });
    if (existingDepartment) {
      return res.status(400).json(new ApiError(400, "Department already exists"));
    }
    let headInfo;
    if (employeeId) {
      headInfo = await Employee.findOne({
        employeeId: employeeId,
        ...(req.companyId ? { companyId: req.companyId } : {}),
      });
      if (!headInfo) {
        return res
          .status(400)
          .json(new ApiError(400, "Employee cannot be found"));
      }
    }

    const data = await Department.create({
      name: name.trim(),
      description: description.trim(),
      head: headInfo?._id,
      companyId: req.companyId,
    });

    if (headInfo) {
      await Notification.create({
        recipient: headInfo._id,
        recipientModel: "Employee",
        title: "Department created",
        message: `You have been assigned as the head of the new department: ${data.name}`,
        companyId: req.companyId,
      });
    }

    await logActivity({
      companyId: req.companyId,
      actor: req.user.id,
      action: "department.created",
      module: "department",
      targetType: "Department",
      targetId: data._id,
      details: `Created department "${data.name}"`,
      ip: req.ip,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, data, "Department created successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const departmentAggregation = (match = {}) => [
  { $match: match },
  {
    $lookup: {
      from: "employees",
      localField: "head",
      foreignField: "_id",
      as: "headDetails",
    },
  },
  { $unwind: { path: "$headDetails", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "employees",
      localField: "_id",
      foreignField: "department",
      as: "members",
    },
  },
  {
    $project: {
      name: 1,
      description: 1,
      companyId: 1,
      head: 1,
      createdAt: 1,
      updatedAt: 1,
      headDetails: { _id: 1, name: 1, email: 1, employeeId: 1, designation: 1 },
      memberCount: { $size: "$members" },
    },
  },
];

export const allDepartmentInfo = async (req, res) => {
  try {
    const data = await Department.aggregate(
      departmentAggregation(req.companyId ? { companyId: req.companyId } : {})
    );
    return res
      .status(200)
      .json(new ApiResponse(200, data, "All department info retrieved"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const OneDepartmentInfo = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      status: 400,
      message: "Invalid department ID format",
      success: false,
    });
  }
  try {
    const data = await Department.aggregate(
      departmentAggregation({
        _id: new mongoose.Types.ObjectId(id),
        ...(req.companyId ? { companyId: req.companyId } : {}),
      })
    );
    if (!data.length) {
      return res.status(404).json(new ApiError(404, "Department not found"));
    }
    return res.status(200).json(new ApiResponse(200, data[0], "Department retrieved"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, employeeId } = req.body;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid department ID"));
    }
    const department = await Department.findOne({
      _id: id,
      ...(req.companyId ? { companyId: req.companyId } : {}),
    });
    if (!department) {
      return res.status(404).json(new ApiError(404, "Department not found"));
    }

    const update = {};
    if (name && name.trim()) update.name = name.trim();
    if (description && description.trim()) update.description = description.trim();
    if (employeeId) {
      const head = await Employee.findOne({
        employeeId,
        ...(req.companyId ? { companyId: req.companyId } : {}),
      });
      if (!head) {
        return res.status(400).json(new ApiError(400, "Employee cannot be found"));
      }
      update.head = head._id;
    }

    const data = await Department.findByIdAndUpdate(id, update, { new: true });

    await logActivity({
      companyId: req.companyId,
      actor: req.user.id,
      action: "department.updated",
      module: "department",
      targetType: "Department",
      targetId: data._id,
      details: `Updated department "${data.name}"`,
      ip: req.ip,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Department updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json(new ApiError(400, "Invalid department ID"));
    }
    const data = await Department.findOneAndDelete({
      _id: id,
      ...(req.companyId ? { companyId: req.companyId } : {}),
    });
    if (!data) {
      return res.status(404).json(new ApiError(404, "Department not found"));
    }

    await logActivity({
      companyId: req.companyId,
      actor: req.user.id,
      action: "department.deleted",
      module: "department",
      targetType: "Department",
      targetId: id,
      details: `Deleted department "${data.name}"`,
      ip: req.ip,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Department deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
