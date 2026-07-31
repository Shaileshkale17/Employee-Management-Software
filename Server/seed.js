import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

import { Employee } from "./model/Employee.model.js";
import { Department } from "./model/Department.mode.js";
import { Company } from "./model/Company.model.js";
import Job from "./model/Job.model.js";
import Candidate from "./model/Candidate.model.js";
import Application from "./model/Application.model.js";

const makeId = async () => {
  const last = await Employee.findOne().sort({ createdAt: -1 });
  let num = 1;
  if (last?.employeeId && /^\d+$/.test(last.employeeId)) {
    num = parseInt(last.employeeId, 10) + 1;
  }
  return String(num);
};

const users = [
  {
    name: "Super Admin",
    email: "superadmin@example.com",
    password: "super@1234",
    role: "Super Admin",
    employeeId: "1000",
    salary: { ctc: 0, basic: 0, hra: 0 },
  },
  {
    name: "HR Admin",
    email: "hr@example.com",
    password: "hr@1234",
    role: "Company Admin",
    employeeId: "EMP001",
    salary: { ctc: 600000, basic: 300000, hra: 120000 },
  },
  {
    name: "HR Manager",
    email: "hrmanager@example.com",
    password: "hr@1234",
    role: "HR",
    employeeId: "EMP002",
    salary: { ctc: 700000, basic: 350000, hra: 140000 },
  },
  {
    name: "Recruiter User",
    email: "recruiter@example.com",
    password: "recruiter@1234",
    role: "Recruiter",
    employeeId: "EMP003",
    salary: { ctc: 500000, basic: 250000, hra: 100000 },
  },
  {
    name: "Interviewer User",
    email: "interviewer@example.com",
    password: "interviewer@1234",
    role: "Interviewer",
    employeeId: "EMP004",
    salary: { ctc: 900000, basic: 450000, hra: 180000 },
  },
  {
    name: "Employee User",
    email: "employee@example.com",
    password: "employee@1234",
    role: "developer",
    employeeId: "EMP005",
    salary: { ctc: 500000, basic: 250000, hra: 100000 },
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.URL);
    console.log("Connected to MongoDB");

    let company = await Company.findOne({ slug: "techcorp" });
    if (!company) {
      company = await Company.create({
        name: "TechCorp",
        slug: "techcorp",
        industry: "Software",
        size: "51-200",
        website: "https://techcorp.example.com",
        address: "Mumbai, India",
        email: "hr@example.com",
        phone: "+91 9923110630",
        contactPerson: "HR Admin",
        isEmailVerified: true,
      });
      console.log("Created company:", company.name);
    }

    const deptData = [
      { name: "General", description: "General department" },
      { name: "Engineering", description: "Software development" },
      { name: "Human Resources", description: "People operations" },
      { name: "Sales", description: "Sales and marketing" },
    ];

    const depts = {};
    for (const d of deptData) {
      let dept = await Department.findOne({ name: d.name, companyId: company._id });
      if (!dept) {
        dept = await Department.create({ ...d, companyId: company._id });
        console.log("Created department:", dept.name);
      }
      depts[d.name] = dept;
    }

    let i = 0;
    for (const u of users) {
      const existing = await Employee.findOne({ email: u.email });
      const role = u.role;
      const deptName =
        role === "Super Admin"
          ? "General"
          : role === "developer"
            ? "Engineering"
            : role === "Interviewer"
              ? "Engineering"
              : "Human Resources";

      const hashedPassword = await bcrypt.hash(u.password, 10);

      if (existing) {
        existing.role = role;
        existing.companyId = company._id;
        existing.department = depts[deptName]._id;
        existing.designation = role === "developer" ? "Software Developer" : role;
        existing.skills =
          role === "developer"
            ? ["React", "Node.js", "MongoDB"]
            : role === "Interviewer"
              ? ["React", "Node.js", "System Design"]
              : ["Recruiting", "Communication"];
        await existing.save();
        console.log(`Updated user: ${u.email} (${role})`);
        continue;
      }

      await Employee.create({
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role,
        companyId: company._id,
        department: depts[deptName]._id,
        employeeId: u.employeeId || `EMP${String(++i).padStart(3, "0")}`,
        salary: u.salary,
        designation: role === "developer" ? "Software Developer" : role,
        skills:
          role === "developer"
            ? ["React", "Node.js", "MongoDB"]
            : role === "Interviewer"
              ? ["React", "Node.js", "System Design"]
              : ["Recruiting", "Communication"],
        joiningDate: new Date(),
        status: "Active",
        workLocation: "Office",
        isEmailVerified: true,
      });
      console.log(`Created user: ${u.email} (${role})`);
    }

    const companyAdmin = await Employee.findOne({ email: "hr@example.com" });
    if (companyAdmin) {
      await Company.findByIdAndUpdate(company._id, { admin: companyAdmin._id });
    }

    let job = await Job.findOne({ title: "Senior React Developer", companyId: company._id });
    if (!job) {
      job = await Job.create({
        companyId: company._id,
        title: "Senior React Developer",
        department: depts["Engineering"]._id,
        departmentName: "Engineering",
        location: "Mumbai (Hybrid)",
        employmentType: "Full-time",
        type: "Full-time",
        salary: "₹18-25 LPA",
        salaryRange: { min: 1800000, max: 2500000 },
        skills: ["React", "Node.js", "TypeScript", "MongoDB"],
        experience: "4-6 years",
        responsibilities: [
          "Build and maintain scalable React applications",
          "Collaborate with product and design teams",
        ],
        qualifications: [
          "4+ years of experience in frontend development",
          "Strong knowledge of JavaScript and TypeScript",
        ],
        description: "We are looking for a Senior React Developer to join our fast growing team.",
        openings: 2,
        lastDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "Active",
        postedBy: companyAdmin?._id,
      });
      console.log("Created sample job:", job.title);
    }

    let candidate = await Candidate.findOne({ email: "candidate@example.com" });
    if (!candidate) {
      candidate = await Candidate.create({
        companyId: company._id,
        firstName: "Jane",
        lastName: "Doe",
        email: "candidate@example.com",
        phone: "+91 9000000000",
        skills: ["React", "Node.js"],
        experience: "5 years",
        education: "B.Tech",
        source: "seed",
      });
      console.log("Created sample candidate");
    }

    const existingApp = await Application.findOne({ job: job._id, candidate: candidate._id });
    if (!existingApp) {
      await Application.create({
        companyId: company._id,
        job: job._id,
        candidate: candidate._id,
        status: "Applied",
        timeline: [{ status: "Applied", note: "Applied via seed", at: new Date() }],
      });
      await Job.findByIdAndUpdate(job._id, { $inc: { applicantsCount: 1 } });
      console.log("Created sample application");
    }

    console.log("\nSeed complete! You can now log in with:");
    console.log("  Super Admin:  superadmin@example.com / super@1234");
    console.log("  Company Admin: hr@example.com / hr@1234");
    console.log("  HR:            hrmanager@example.com / hr@1234");
    console.log("  Recruiter:     recruiter@example.com / recruiter@1234");
    console.log("  Interviewer:   interviewer@example.com / interviewer@1234");
    console.log("  Employee:      employee@example.com / employee@1234");
    console.log("  Public Careers: /careers/techcorp");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

seed();
