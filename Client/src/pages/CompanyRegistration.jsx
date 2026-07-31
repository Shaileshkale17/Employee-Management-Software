import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import InputBox from "../components/InputBox";
import SelectBox from "../components/SelectBox";
import Button from "../components/Button";
import { api } from "../utils/api";

const industryOptions = [
  { label: "Software / IT", value: "Software / IT" },
  { label: "Healthcare", value: "Healthcare" },
  { label: "Finance", value: "Finance" },
  { label: "Education", value: "Education" },
  { label: "Retail", value: "Retail" },
  { label: "Manufacturing", value: "Manufacturing" },
  { label: "Marketing", value: "Marketing" },
  { label: "Other", value: "Other" },
];

const sizeOptions = [
  { label: "1-10", value: "1-10" },
  { label: "11-50", value: "11-50" },
  { label: "51-200", value: "51-200" },
  { label: "201-500", value: "201-500" },
  { label: "501-1000", value: "501-1000" },
  { label: "1000+", value: "1000+" },
];

const initialForm = {
  name: "",
  industry: "",
  size: "",
  website: "",
  address: "",
  gst: "",
  contactPerson: "",
  email: "",
  phone: "",
  password: "",
};

const CompanyRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (v) => setFormData((p) => ({ ...p, [key]: v }));

  const validate = () => {
    const err = {};
    if (!formData.name.trim()) err.name = "Company name is required";
    if (!formData.contactPerson.trim()) err.contactPerson = "Contact person is required";
    if (!formData.email.trim()) err.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) err.email = "Enter a valid email";
    if (!formData.phone.trim()) err.phone = "Phone number is required";
    if (!formData.password) err.password = "Password is required";
    else if (formData.password.length < 6) err.password = "Password must be at least 6 characters";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      if (logo) fd.append("logo", logo);

      await api.post("/company/register", fd);
      toast.success("Company registered! Verification email sent.");
      navigate("/");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F2F6] via-[#F8F9FF] to-[#E8EAF6] py-10 px-4">
      <div className="max-w-2xl mx-auto animate-fadeIn">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#3354F4] to-[#1a3bb8] rounded-2xl shadow-lg shadow-[#3354F4]/20 mb-4">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M5 21V7l7-4 7 4v14" />
              <path d="M9 21v-4h6v4" />
              <path d="M9 9h.01" />
              <path d="M15 9h.01" />
              <path d="M9 13h.01" />
              <path d="M15 13h.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-montserrat tracking-tight">Register Your Company</h1>
          <p className="text-gray-500 text-sm font-montserrat mt-1">
            Create your workspace and start hiring. HR Admin account is created automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl shadow-gray-200/70 border border-gray-100 p-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-gray-300 text-xs text-center px-1">Logo</span>
                )}
              </div>
              <label className="px-4 py-2 bg-brand-50 text-brand-700 text-sm font-medium rounded-lg cursor-pointer hover:bg-brand-100 transition-colors">
                Upload Logo
                <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputBox label="Company Name" id="name" placeholder="e.g. TechCorp" name="name" setInput={set("name")} getInput={formData.name} error={errors.name} />
            <SelectBox label="Industry" id="industry" name="industry" setInput={set("industry")} getInput={formData.industry} option={industryOptions} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectBox label="Company Size" id="size" name="size" setInput={set("size")} getInput={formData.size} option={sizeOptions} />
            <InputBox label="Website" id="website" placeholder="https://..." name="website" setInput={set("website")} getInput={formData.website} />
          </div>

          <InputBox label="Address" id="address" placeholder="Registered office address" name="address" setInput={set("address")} getInput={formData.address} />
          <InputBox label="GST (optional)" id="gst" placeholder="GST number" name="gst" setInput={set("gst")} getInput={formData.gst} />

          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">HR Admin Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputBox label="Contact Person" id="contactPerson" placeholder="Full name" name="contactPerson" setInput={set("contactPerson")} getInput={formData.contactPerson} error={errors.contactPerson} />
              <InputBox label="Phone Number" id="phone" placeholder="+91 ..." name="phone" setInput={set("phone")} getInput={formData.phone} error={errors.phone} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <InputBox label="Email" id="email" type="email" placeholder="hr@company.com" name="email" setInput={set("email")} getInput={formData.email} error={errors.email} />
              <InputBox label="Password" id="password" type="password" placeholder="Min 6 characters" name="password" setInput={set("password")} getInput={formData.password} error={errors.password} />
            </div>
          </div>

          <Button type="submit" label="Create Workspace" loading={loading} disabled={loading} className="w-full" />

          <p className="text-center font-montserrat text-sm text-gray-500">
            Already registered?{" "}
            <Link to="/" className="text-[#3354F4] hover:text-[#2a45d4] hover:underline font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default CompanyRegistration;
