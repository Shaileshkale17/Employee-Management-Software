import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import InputBox from "../components/InputBox";
import TextArea from "../components/TextArea";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import { api } from "../utils/api";
import { Briefcase, MapPin, CircleCheck, Upload } from "lucide-react";

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

  if (!job) {
    return (
      <div className="min-h-screen bg-mesh-light py-10 px-4">
        <div className="max-w-2xl mx-auto animate-fade-in">
          <Skeleton className="h-4 w-32 mb-6" />
          <div className="card-surface p-4 mb-6">
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-5 w-2/3 mb-2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <div className="card-surface p-6 sm:p-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh-light py-10 px-4">
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <Link to={`/careers/${slug}/${jobId}`} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-600 font-medium transition-colors focus-ring rounded-lg mb-6">
          <span aria-hidden="true">←</span> Back to job details
        </Link>

        <div className="card-surface p-4 mb-6 flex items-start gap-3.5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/10">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-ink-400 mb-1">Applying for</p>
            <h1 className="text-lg font-semibold text-ink-950 truncate">{job.title}</h1>
            <p className="text-xs text-ink-400 mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location} · {job.employmentType}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card-surface shadow-popover p-6 sm:p-8 space-y-5">
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
            <label className="block text-[13px] font-semibold text-ink-800 mb-1.5">Resume (PDF, DOC, DOCX, TXT — max 5MB)</label>
            <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-8 px-6 cursor-pointer transition-all duration-200 ease-smooth focus-ring ${resume ? "border-brand-400 bg-brand-50" : "border-ink-300 bg-surface-50 hover:border-brand-400 hover:bg-brand-50/40"}`}>
              {resume ? (
                <>
                  <CircleCheck className="w-7 h-7 text-brand-600" />
                  <span className="text-sm font-medium text-brand-700">{resume.name}</span>
                  <span className="text-[11px] text-ink-400">Click to replace</span>
                </>
              ) : (
                <>
                  <Upload className="w-7 h-7 text-ink-400" />
                  <span className="text-xs text-ink-500">Click to upload resume</span>
                  <span className="text-[11px] text-ink-400">PDF, DOC, DOCX, TXT · Max 5MB</span>
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
