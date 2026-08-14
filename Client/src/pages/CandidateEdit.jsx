import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { api } from "../utils/api";
import Button from "../components/Button";
import InputBox from "../components/InputBox";
import TextArea from "../components/TextArea";

const CandidateEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const role = user?.user?.role;
  const canManage = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(role);
  const SideNav = (r) => {
    if (r === "developer" || r === "Employee" || r === "Interviewer") return <SideNavbar />;
    if (canManage) return <HRSideNavber />;
    return null;
  };

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    skills: "",
    experience: "",
    education: "",
    linkedin: "",
    portfolio: "",
    coverLetter: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/candidate/show/${id}`)
      .then((res) => {
        const c = res.data.data;
        setFormData({
          firstName: c.firstName || "",
          lastName: c.lastName || "",
          email: c.email || "",
          phone: c.phone || "",
          skills: (c.skills || []).join(", "),
          experience: c.experience || "",
          education: c.education || "",
          linkedin: c.linkedin || "",
          portfolio: c.portfolio || "",
          coverLetter: c.coverLetter || "",
          notes: c.notes || "",
        });
      })
      .catch(() => toast.error("Failed to load candidate"))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key) => (v) => setFormData((p) => ({ ...p, [key]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/candidate/update/${id}`, {
        ...formData,
        skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success("Candidate updated");
      navigate(`/candidates/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update candidate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="animate-fade-in-down">
            <Link
              to={`/candidates/${id}`}
              className="group mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors duration-200 hover:text-brand-600"
            >
              <span className="transition-transform duration-200 group-hover:-translate-x-0.5">←</span>
              Back to profile
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
              Edit Candidate
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Update the candidate&apos;s profile details
            </p>
          </div>

          {loading ? (
            <div className="card-surface space-y-4 p-6 lg:p-8 animate-fade-in">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="skeleton h-[68px] w-full" />
                <div className="skeleton h-[68px] w-full" />
                <div className="skeleton h-[68px] w-full" />
                <div className="skeleton h-[68px] w-full" />
                <div className="skeleton h-[68px] w-full" />
                <div className="skeleton h-[68px] w-full" />
              </div>
              <div className="skeleton h-[68px] w-full" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="skeleton h-[68px] w-full" />
                <div className="skeleton h-[68px] w-full" />
              </div>
              <div className="skeleton h-32 w-full" />
              <div className="skeleton h-20 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card-surface p-6 lg:p-8 animate-fade-in-up">
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputBox label="First name" id="firstName" name="firstName" placeholder="Jane" setInput={set("firstName")} getInput={formData.firstName} />
                  <InputBox label="Last name" id="lastName" name="lastName" placeholder="Doe" setInput={set("lastName")} getInput={formData.lastName} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputBox label="Email" id="email" type="email" name="email" placeholder="jane@example.com" setInput={set("email")} getInput={formData.email} />
                  <InputBox label="Phone" id="phone" name="phone" placeholder="+91 ..." setInput={set("phone")} getInput={formData.phone} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputBox label="Skills" id="skills" name="skills" placeholder="Comma-separated" setInput={set("skills")} getInput={formData.skills} />
                  <InputBox label="Experience" id="experience" name="experience" placeholder="e.g. 3 years" setInput={set("experience")} getInput={formData.experience} />
                </div>
                <InputBox label="Education" id="education" name="education" placeholder="e.g. B.Tech" setInput={set("education")} getInput={formData.education} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputBox label="LinkedIn" id="linkedin" name="linkedin" placeholder="https://linkedin.com/in/..." setInput={set("linkedin")} getInput={formData.linkedin} />
                  <InputBox label="Portfolio" id="portfolio" name="portfolio" placeholder="https://..." setInput={set("portfolio")} getInput={formData.portfolio} />
                </div>
                <TextArea label="Cover letter" id="coverLetter" name="coverLetter" placeholder="Cover letter" value={formData.coverLetter} onChange={(e) => set("coverLetter")(e.target.value)} rows={4} />
                <TextArea label="Internal notes" id="notes" name="notes" placeholder="Internal notes" value={formData.notes} onChange={(e) => set("notes")(e.target.value)} rows={2} />
              </div>
              <div className="mt-6 flex justify-end gap-2 border-t border-ink-100 pt-5">
                <Button variant="secondary" label="Cancel" onClick={() => navigate(`/candidates/${id}`)} />
                <Button type="submit" label="Save changes" loading={saving} disabled={saving} />
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default CandidateEdit;
