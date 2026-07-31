import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import InputBox from "../components/InputBox";
import TextArea from "../components/TextArea";
import Button from "../components/Button";
import { api } from "../utils/api";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  experience: "",
  skills: "",
  education: "",
  linkedin: "",
  portfolio: "",
  coverLetter: "",
};

const CareerApply = () => {
  const { slug, jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get(`/job/public/${slug}/${jobId}`).then((res) => {
      setJob(res.data.data.job);
    }).catch(() => setJob(null));
  }, [slug, jobId]);

  const set = (key) => (v) => setFormData((p) => ({ ...p, [key]: v }));

  const validate = () => {
    const err = {};
    if (!formData.firstName.trim()) err.firstName = "First name is required";
    if (!formData.lastName.trim()) err.lastName = "Last name is required";
    if (!formData.email.trim()) err.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) err.email = "Enter a valid email";
    if (!formData.phone.trim()) err.phone = "Phone is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!resume && !formData.coverLetter) {
      toast.error("Please upload a resume or provide a cover letter");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      if (resume) fd.append("resume", resume);

      await api.post(`/application/apply/${slug}/${jobId}`, fd);
      toast.success("Application submitted successfully!");
      navigate(`/careers/${slug}/${jobId}/success`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F2F6] via-[#F8F9FF] to-[#E8EAF6] py-10 px-4">
      <div className="max-w-2xl mx-auto animate-fadeIn">
        <Link to={`/careers/${slug}/${jobId}`} className="text-sm text-gray-500 hover:text-brand-600 font-medium transition-colors mb-6 inline-block">
          ← Back to job details
        </Link>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 mb-6">
          <p className="text-xs text-gray-500 mb-1">Applying for</p>
          <h1 className="text-lg font-semibold text-gray-900">{job.title}</h1>
          <p className="text-xs text-gray-400 mt-1">📍 {job.location} · {job.employmentType}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl shadow-gray-200/70 border border-gray-100 p-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputBox label="First Name" id="firstName" placeholder="Jane" name="firstName" setInput={set("firstName")} getInput={formData.firstName} error={errors.firstName} />
            <InputBox label="Last Name" id="lastName" placeholder="Doe" name="lastName" setInput={set("lastName")} getInput={formData.lastName} error={errors.lastName} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputBox label="Email" id="email" type="email" placeholder="jane@example.com" name="email" setInput={set("email")} getInput={formData.email} error={errors.email} />
            <InputBox label="Phone" id="phone" placeholder="+91 ..." name="phone" setInput={set("phone")} getInput={formData.phone} error={errors.phone} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputBox label="Experience" id="experience" placeholder="e.g. 3 years" name="experience" setInput={set("experience")} getInput={formData.experience} />
            <InputBox label="Skills" id="skills" placeholder="Comma-separated, e.g. React, Node.js" name="skills" setInput={set("skills")} getInput={formData.skills} />
          </div>
          <InputBox label="Education" id="education" placeholder="e.g. B.Tech Computer Science" name="education" setInput={set("education")} getInput={formData.education} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputBox label="LinkedIn" id="linkedin" placeholder="https://linkedin.com/in/..." name="linkedin" setInput={set("linkedin")} getInput={formData.linkedin} />
            <InputBox label="Portfolio" id="portfolio" placeholder="https://..." name="portfolio" setInput={set("portfolio")} getInput={formData.portfolio} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Resume (PDF, DOC, DOCX, TXT — max 5MB)</label>
            <label className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-xl py-6 cursor-pointer transition-colors ${resume ? "border-brand-400 bg-brand-50" : "border-gray-200 bg-gray-50 hover:border-brand-300 hover:bg-brand-50/50"}`}>
              {resume ? (
                <span className="text-sm font-medium text-brand-700">{resume.name}</span>
              ) : (
                <>
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="text-xs text-gray-500">Click to upload resume</span>
                </>
              )}
              <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => setResume(e.target.files?.[0] || null)} />
            </label>
          </div>

          <TextArea label="Cover Letter" id="coverLetter" placeholder="Tell us why you're a great fit..." name="coverLetter" value={formData.coverLetter} onChange={(e) => set("coverLetter")(e.target.value)} rows={5} />

          <Button type="submit" label="Submit Application" loading={loading} disabled={loading} className="w-full" />
        </form>
      </div>
    </div>
  );
};

export default CareerApply;
