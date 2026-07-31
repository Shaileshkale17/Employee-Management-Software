import { useEffect, useState } from "react";
import Heading from "../components/Heading";
import Button from "../components/Button";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api } from "../utils/api";

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

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";
  const labelClass = "text-sm font-semibold text-gray-700";

  return (
    <div className="flex">
      {SideNav}
      <div className="flex-1 min-h-[calc(100vh-4rem)] bg-surface-100 p-6 overflow-y-auto">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8 animate-fade-in-up">
          <Heading heading="Employee Registration" className="text-2xl mb-6" />
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 border border-red-100">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input type="text" name="name" placeholder="Full Name" onChange={handleChange} value={formData.name} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" name="email" placeholder="Email" onChange={handleChange} value={formData.email} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input type="password" name="password" placeholder="Password" onChange={handleChange} value={formData.password} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Department</label>
                <select name="department" onChange={handleChange} value={formData.department} required className={inputClass}>
                  <option value="">---Select---</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <select name="role" onChange={handleChange} value={formData.role} required className={inputClass}>
                  <option value="">---Select---</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input type="text" name="designation" placeholder="Designation" onChange={handleChange} value={formData.designation} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Joining Date</label>
                <input type="date" name="joiningDate" onChange={handleChange} value={formData.joiningDate} className={inputClass} />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-2">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Salary Details</h3>
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
                  <div key={key}>
                    <label className="text-xs text-gray-500">{label}</label>
                    <input type="number" name={key} placeholder={label} onChange={handleChange} value={formData[key]} className={inputClass} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-gray-500">Currency</label>
                  <input type="text" value="INR" disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Payment Frequency</label>
                  <input type="text" value="Monthly" disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
                </div>
              </div>
            </div>

            <Button type="submit" label="Register Employee" loading={loading} disabled={loading} className="w-full mt-4" />
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegistration;
