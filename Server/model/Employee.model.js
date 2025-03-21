import mongoose from "mongoose";

const EmployeeSchema = mongoose.Schema(
  {
    Emp_id: {
      type: String,
      required: true,
      trim: true,
    },
    First_Name: {
      type: String,
      required: true,
      trim: true,
    },
    Last_Name: {
      type: String,
      required: true,
      trim: true,
    },
    Email: {
      type: String,
      required: true,
      trim: true,
    },
    Password: {
      type: String,
      required: true,
    },
    Image: {
      type: String,
    },
    DOB: {
      type: String,
    },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "Employee", "HR"],
      default: "Employee",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    salary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salary",
    },
    joiningDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const Employee = mongoose.model("Employee", EmployeeSchema);
