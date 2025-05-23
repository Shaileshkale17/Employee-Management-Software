import asyncHandler from "../utils/asycHandler.js";
import ApiError from "../utils/ApiError.js";
import { Employee } from "../model/Employee.model.js";
import nodemailer from "nodemailer";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const employeeIdCreate = async () => {
  const lastEmployee = await Employee.findOne().sort({ _id: -1 });

  let newId = 1;
  if (lastEmployee) {
    newId = lastEmployee._id + Math.floor(Math.random(2) * 100);
  }
  console.log(newId.toString().split("").reverse().join(""));
  return newId;
};

export const createEmployee = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    department,
    currency,
    paymentFrequency,
    joiningDate,
    salary: {
      ctc,
      basic,
      hra,
      allowances,
      tax,
      pf,
      otherDeductions,
      netSalary,
    } = {},
  } = req.body;

  try {
    if (
      [name, email, password, role].some(
        (field) => !field || field.trim() === ""
      )
    ) {
      return res.status(400).json(new ApiError(400, "All fields are required"));
    }

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res
        .status(400)
        .json(new ApiError(400, "Employee already exists", existingEmployee));
    }

    let employeeId = await employeeIdCreate();
    let hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await Employee.create({
      employeeId,
      name,
      email,
      password: hashedPassword,
      role,
      department,
      salary: {
        ctc,
        basic,
        hra,
        allowances,
        tax,
        pf,
        otherDeductions,
        netSalary,
      },
      currency,
      paymentFrequency,
      joiningDate,
    });

    if (!newEmployee) {
      return res
        .status(500)
        .json(new ApiError(500, "Employee creation failed"));
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const userMailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: email,
      subject: "Your Employee Account Has Been Created!",
      text: `Dear ${name},

      Congratulations! Your employee account has been successfully created.

      Here are your account details:
      - Employee ID: ${employeeId}
      - Email: ${email}
      - Temporary Password: ${password}

      Please change your password upon first login for security reasons.

      If you have any questions, feel free to reach out.

      Best regards,  
      Shailesh Dnyaneshwar Kale  
      Full-stack Developer  

      Portfolio: https://protfolio-shailesh-full-stack-developer.vercel.app  
      Email: shaileshkale87730@gmail.com  
      Phone: +91 9923110630
      `,
    };

    await transporter.sendMail(userMailOptions);

    return res
      .status(201)
      .json(new ApiResponse(201, newEmployee, "Employee created successfully"));
  } catch (error) {
    console.log(error);
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const LoginEmployee = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!(email && password)) {
      return res.status(400).json(new ApiError(400, "All fields are required"));
    }

    const user = await Employee.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
        success: false,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 401,
        message: "Invalid email or password",
        success: false,
      });
    }

    const token = await jwt.sign(
      {
        id: user._id,
        role: user.role,
        employeeId: user.employeeId,
      },
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      status: 200,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        FullName: user.name,
        email: user.email,
        workLocation: user.workLocation,
        employeeId: user.employeeId,
        role: user.role,
      },
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const EmployeeAllInfo = async (req, res, io) => {
  try {
    const data = await Employee.aggregate([
      {
        $unwind: {
          path: "$Department",
          preserveNullAndEmptyArrays: true, // Include users without Department
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "DepartmentDetails",
        },
      },
      {
        $unwind: {
          path: "$DepartmentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    io.emit("All_Employee_Info", {
      message: "All Employee have been retrieved",
      count: data.length,
      data,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, data, "All Employee fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const EmployeeOneInfo = async (req, res, io) => {
  const socketId = req.query.socketId; // Get from frontend
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      status: 400,
      message: "Invalid user ID format",
      success: false,
    });
  }

  try {
    const data = await Employee.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) },
      },
      {
        $unwind: {
          path: "$Department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "DepartmentDetails",
        },
      },
      {
        $unwind: {
          path: "$DepartmentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    io.to(socketId).emit("All_Employee_Info", {
      message: "All Employee have been retrieved",
      count: data.length,
      data,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, data, "All Employee fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const EmployeeInfoUpdate = async (req, res, io) => {
  const { id } = req.params;
  const {
    name,
    email,
    password,
    role,
    department,
    ctc,
    basic,
    hra,
    allowances,
    tax,
    pf,
    otherDeductions,
    netSalary,
    currency,
    paymentFrequency,
    joiningDate,
  } = req.body;
  try {
    if (!id) {
      return res.status(401).json(new ApiError(401, "Id Not Found"));
    }

    const data = Employee.findByIdAndUpdate(
      id,
      {
        name,
        email,
        password,
        role,
        department,
        ctc,
        basic,
        hra,
        allowances,
        tax,
        pf,
        otherDeductions,
        netSalary,
        currency,
        paymentFrequency,
        joiningDate,
      },
      { new: true }
    );

    io.emit("All_Employee_Info_Update", {
      message: "All Employee have been retrieved",
      count: data.length,
      data,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, data, "All Employee Updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const EmployeeInfoDeleted = async (req, res, io) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(401).json(new ApiError(401, "Id Not Found"));
    }

    const data = Employee.findByIdAndDelete(id, { new: true });

    return res
      .status(200)
      .json(new ApiResponse(200, data, "All Employee Deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
