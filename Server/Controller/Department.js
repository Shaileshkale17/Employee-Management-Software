import mongoose from "mongoose";
import { Department } from "../model/Department.mode.js";
import { Employee } from "../model/Employee.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createDepartment = async (req, res, io) => {
  const { name, description, employeeId } = req.body;

  if ([name, description].some((f) => !f || f.trim() === "")) {
    return res
      .status(400)
      .json(new ApiError(400, "Name and description fields are required"));
  }
  const existingDepartment = await Department.findOne({ name });
  if (existingDepartment) {
    return res.status(400).json(new ApiError(400, "Department already exists"));
  }
  let headInfo;
  if (employeeId) {
    headInfo = await Employee.findOne({ employeeId: employeeId });
    console.log("headInfo", headInfo);
    if (!headInfo) {
      return res
        .status(400)
        .json(new ApiError(400, "Employee cannot be found"));
    }
  }

  const data = await Department.create({
    name,
    description,
    head: headInfo?._id,
  });
  if (!data) {
    return res
      .status(500)
      .json(new ApiError(500, "Department creation failed"));
  }
  // Emit event to notify clients (if using WebSockets)
  if (io) {
    io.emit("departmentCreated", data);
  }

  return res
    .status(201)
    .json(new ApiResponse(201, data, "Department created successfully"));
};

export const allDepartmentInfo = async (req, res, io) => {
  const data = await Department.aggregate([
    {
      $unwind: {
        path: "$HeadOfDepartment",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "head",
        foreignField: "_id",
        as: "HeadOfDepartment",
      },
    },
    {
      $unwind: {
        path: "$HeadOfDepartment",
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);
  if (io) {
    io.emit("departmentallinfo", data);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, data, "all info in department", true));
};
export const OneDepartmentInfo = async (req, res, io) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      status: 400,
      message: "Invalid user ID format",
      success: false,
    });
  }
  const data = await Department.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(id) },
    },

    {
      $unwind: {
        path: "$HeadOfDepartment",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "head",
        foreignField: "_id",
        as: "HeadOfDepartment",
      },
    },
    {
      $unwind: {
        path: "$HeadOfDepartment",
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);
  if (io) {
    io.emit("departmentallinfo", data);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, data, "all info in department", true));
};

export const updateDepartment = async (req, res, io) => {
  const { id } = req.params;
  const { name, description, employeeId } = req.body;
  try {
    if (!id) {
      return res.status(401).json(new ApiError(401, "Id Not Found"));
    }

    const data = await Department.findByIdAndUpdate(
      id,
      {
        name,
        description,
        employeeId,
      },
      {
        new: true,
      }
    );

    io.emit("All_Department_Info_Update", {
      message: "All Department have been retrieved",
      count: data.length,
      data,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Department Updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const deleteDepartment = async (req, res, io) => {
  const { id } = req.params;
  try {
    await Department.findByIdAndDelete(id);
    return res
      .status(200)
      .json(new ApiResponse(200, data, "Department Deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
