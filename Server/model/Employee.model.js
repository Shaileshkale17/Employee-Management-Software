import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    salary: {
      ctc: { type: Number, required: true }, //* Cost to Company (Annual)
      basic: { type: Number, required: true },
      hra: { type: Number, required: true }, //* House Rent Allowance
      allowances: { type: Number, default: 0 },
      deductions: {
        tax: { type: Number, default: 0 },
        pf: { type: Number, default: 0 }, //* Provident Fund
        otherDeductions: { type: Number, default: 0 },
      },
      netSalary: { type: Number }, //* Computed: (Basic + HRA + Allowances - Deductions)
      currency: { type: String, default: "INR" },
      paymentFrequency: {
        type: String,
        enum: ["Monthly", "Bi-Weekly", "Weekly"],
        default: "Monthly",
      },
    },
    salaryHistory: [
      {
        ctc: Number,
        basic: Number,
        hra: Number,
        allowances: Number,
        deductions: {
          tax: Number,
          pf: Number,
          otherDeductions: Number,
        },
        netSalary: Number,
        effectiveDate: Date,
      },
    ],
    joiningDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

export const Employee = mongoose.model("Employee", EmployeeSchema);
