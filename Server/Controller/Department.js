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
  console.log({ name, description, employeeId });
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
  console.log("headInfo2", headInfo);
  console.log(existingDepartment);
  const data = await Department.create({
    name,
    description,
    head: headInfo?._id,
  });
  console.log("data", data);
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
