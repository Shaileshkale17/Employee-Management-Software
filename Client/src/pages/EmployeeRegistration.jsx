import { useEffect, useState } from "react";
import Heading from "../components/Heading";
import Button from "../components/Button";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api } from "../utils/api";
import { CircleAlert } from "lucide-react";

const ROLES = [
  "Company Admin",
  "HR",
  "HR Manager",
  "Recruiter",
  "Interviewer",
  "Employee",
  "developer",
];

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  department: "",
  role: "",
  designation: "",
  ctc: "",
  basic: "",
  hra: "",
  allowances: "",
  tax: "",
  pf: "",
  otherDeductions: "",
  netSalary: "",
  joiningDate: "",
};

const EmployeeRegistration = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.user?.role;
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/company/departments")
      .then((res) => setDepartments(res.data?.data || []))
      .catch(() => setDepartments([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isEmailValid(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const salary = {
        ctc: Number(formData.ctc) || 0,
        basic: Number(formData.basic) || 0,
        hra: Number(formData.hra) || 0,
        allowances: Number(formData.allowances) || 0,
        tax: Number(formData.tax) || 0,
        pf: Number(formData.pf) || 0,
        otherDeductions: Number(formData.otherDeductions) || 0,
        netSalary: Number(formData.netSalary) || 0,
        currency: "INR",
        paymentFrequency: "Monthly",
      };
      await api.post("/emp/emp-post", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department || undefined,
        designation: formData.designation,
        joiningDate: formData.joiningDate || undefined,
        salary,
      });
      toast.success("Employee registered successfully!");
      setFormData(EMPTY_FORM);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register employee.");
    } finally {
      setLoading(false);
    }
  };

  const SideNav =
    ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(role)
      ? <HRSideNavber />
      : <SideNavbar />;

  const inputClass = "input-base px-4";
  const labelClass = "text-[13px] font-semibold text-ink-800";
  const selectClass = `${inputClass} appearance-none cursor-pointer pr-10`;
  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a94a6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
  };

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="w-full max-w-3xl mx-auto">
          <div className="card-surface p-6 lg:p-8 shadow-modal animate-fade-in-up">
            <Heading heading="Employee Registration" subtitle="Add a new employee to your organisation" className="text-2xl mb-6" />
            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 border border-red-100 flex items-center gap-2" role="alert">
                <CircleAlert className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col items-start gap-1.5">
                  <label className={labelClass} htmlFor="name">Full Name</label>
                  <input type="text" id="name" name="name" placeholder="Full Name" onChange={handleChange} value={formData.name} required className={inputClass} />
                </div>
                <div className="flex flex-col items-start gap-1.5">
                  <label className={labelClass} htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" placeholder="Email" onChange={handleChange} value={formData.email} required className={inputClass} />
                </div>
                <div className="flex flex-col items-start gap-1.5">
                  <label className={labelClass} htmlFor="password">Password</label>
                  <input type="password" id="password" name="password" placeholder="Password" onChange={handleChange} value={formData.password} required className={inputClass} />
                </div>
                <div className="flex flex-col items-start gap-1.5">
                  <label className={labelClass} htmlFor="department">Department</label>
                  <select id="department" name="department" onChange={handleChange} value={formData.department} required className={selectClass} style={selectStyle}>
                    <option value="">---Select---</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col items-start gap-1.5">
                  <label className={labelClass} htmlFor="role">Role</label>
                  <select id="role" name="role" onChange={handleChange} value={formData.role} required className={selectClass} style={selectStyle}>
                    <option value="">---Select---</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col items-start gap-1.5">
                  <label className={labelClass} htmlFor="designation">Designation</label>
                  <input type="text" id="designation" name="designation" placeholder="Designation" onChange={handleChange} value={formData.designation} className={inputClass} />
                </div>
                <div className="flex flex-col items-start gap-1.5">
                  <label className={labelClass} htmlFor="joiningDate">Joining Date</label>
                  <input type="date" id="joiningDate" name="joiningDate" onChange={handleChange} value={formData.joiningDate} className={inputClass} />
                </div>
              </div>

              <div className="border-t border-ink-100 pt-5 mt-1">
                <h3 className="text-sm font-semibold text-ink-900 mb-3">Salary Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ["ctc", "CTC"],
                    ["basic", "Basic"],
                    ["hra", "HRA"],
                    ["allowances", "Allowances"],
                    ["tax", "Tax"],
                    ["pf", "PF"],
                    ["otherDeductions", "Other Deductions"],
                    ["netSalary", "Net Salary"],
                  ].map(([key, label]) => (
                    <div key={key} className="flex flex-col items-start gap-1.5">
                      <label htmlFor={key} className="text-xs text-ink-500">{label}</label>
                      <input id={key} type="number" name={key} placeholder={label} onChange={handleChange} value={formData[key]} className={inputClass} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="flex flex-col items-start gap-1.5">
                    <label className="text-xs text-ink-500">Currency</label>
                    <input type="text" value="INR" disabled className={`${inputClass} opacity-60 cursor-not-allowed bg-surface-100`} />
                  </div>
                  <div className="flex flex-col items-start gap-1.5">
                    <label className="text-xs text-ink-500">Payment Frequency</label>
                    <input type="text" value="Monthly" disabled className={`${inputClass} opacity-60 cursor-not-allowed bg-surface-100`} />
                  </div>
                </div>
              </div>

              <Button type="submit" label="Register Employee" loading={loading} disabled={loading} className="w-full mt-2" />
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeRegistration;
