import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    designation: { type: String, default: "" },
    skills: [{ type: String }],
    profileImg: { type: String, default: "" },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    salary: {
      ctc: { type: Number },
      basic: { type: Number },
      hra: { type: Number },
      allowances: { type: Number, default: 0 },
      deductions: {
        tax: { type: Number, default: 0 },
        pf: { type: Number, default: 0 },
        otherDeductions: { type: Number, default: 0 },
      },
      netSalary: { type: Number },
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
    Sick: {
      type: String,
      default: "14",
    },
    Casual: {
      type: String,
      default: "14",
    },
    Paid: {
      type: String,
      default: "14",
    },
    Unpaid: {
      type: String,
      default: "14",
    },
    joiningDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["Active", "Inactive"], default: "Inactive" },
    workLocation: {
      type: String,
      enum: ["on-site", "hybrid", "Remote", "Office"],
      default: "Office",
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: "" },
    employeeId: { type: String, required: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    otp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    mfaEnabled: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    online: { type: Boolean, default: false },
  },
  { timestamps: true }
);

EmployeeSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiresAt;
  delete obj.emailVerificationToken;
  return obj;
};

export const Employee = mongoose.model("Employee", EmployeeSchema);
