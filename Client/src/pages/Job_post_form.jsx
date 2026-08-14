import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideNavbar from "../components/SideNavber";
import HRSideNavbar from "../components/HRSideNavber";
import { useSelector } from "react-redux";
import InputBox from "../components/InputBox";
import SelectBox from "../components/SelectBox";
import TextArea from "../components/TextArea";
import Button from "../components/Button";
import { toast } from "react-toastify";
import { api } from "../utils/api";

const experienceOptions = [
  { label: "0-1 years", value: "0-1 years" },
  { label: "1-2 years", value: "1-2 years" },
  { label: "2-3 years", value: "2-3 years" },
  { label: "3-4 years", value: "3-4 years" },
  { label: "4-5 years", value: "4-5 years" },
  { label: "5-6 years", value: "5-6 years" },
  { label: "6-7 years", value: "6-7 years" },
  { label: "7-8 years", value: "7-8 years" },
  { label: "8-9 years", value: "8-9 years" },
  { label: "9-10 years", value: "9-10 years" },
  { label: "10+ years", value: "10+ years" },
];

const jobTypeOptions = [
  { label: "Full-time", value: "Full-time" },
  { label: "Part-time", value: "Part-time" },
  { label: "Internship", value: "Internship" },
  { label: "Freelance", value: "Freelance" },
  { label: "Contract", value: "Contract" },
  { label: "Temporary", value: "Temporary" },
  { label: "Volunteer", value: "Volunteer" },
  { label: "Apprenticeship", value: "Apprenticeship" },
];

const statusOptions = [
  { label: "Active", value: "Active" },
  { label: "Draft", value: "Draft" },
];

const initialForm = {
  title: "",
  department: "",
  departmentName: "",
  location: "",
  employmentType: "",
  salary: "",
  salaryMin: "",
  salaryMax: "",
  skills: "",
  experience: "",
  responsibilities: "",
  qualifications: "",
  description: "",
  openings: "1",
  lastDate: "",
  status: "Active",
};

const Job_post_form = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState(initialForm);

  const role = user?.user?.role;
  const sideNavComponent =
    role === "developer" || role === "Employee" || role === "Interviewer"
      ? <SideNavbar />
      : ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(role)
        ? <HRSideNavbar />
        : null;

  useEffect(() => {
    api.get("/company/departments")
      .then((res) => setDepartments(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    setPrefillLoading(true);
    api.get(`/job/show/${id}`)
      .then((res) => {
        const j = res.data.data;
        setFormData({
          title: j.title || "",
          department: j.department || "",
          departmentName: j.departmentName || "",
          location: j.location || "",
          employmentType: j.employmentType || "",
          salary: j.salary || "",
          salaryMin: j.salaryRange?.min ?? "",
          salaryMax: j.salaryRange?.max ?? "",
          skills: (j.skills || []).join(", "),
          experience: j.experience || "",
          responsibilities: (j.responsibilities || []).join("\n"),
          qualifications: (j.qualifications || []).join("\n"),
          description: j.description || "",
          openings: j.openings ?? "1",
          lastDate: j.lastDate ? String(j.lastDate).slice(0, 10) : "",
          status: j.status || "Active",
        });
      })
      .catch(() => toast.error("Failed to load job"))
      .finally(() => setPrefillLoading(false));
  }, [id]);

  const set = (key) => (v) => setFormData((p) => ({ ...p, [key]: v }));

  const splitLines = (v) => v.split("\n").map((s) => s.trim()).filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.location) {
      toast.error("Title and Location are required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        department: formData.department || null,
        departmentName: formData.departmentName || departments.find((d) => d._id === formData.department)?.name || "",
        location: formData.location,
        employmentType: formData.employmentType || "Full-time",
        salary: formData.salary,
        salaryRange: {
          min: formData.salaryMin ? Number(formData.salaryMin) : null,
          max: formData.salaryMax ? Number(formData.salaryMax) : null,
        },
        skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        experience: formData.experience,
        responsibilities: splitLines(formData.responsibilities),
        qualifications: splitLines(formData.qualifications),
        description: formData.description,
        openings: Number(formData.openings) || 1,
        lastDate: formData.lastDate || null,
        status: formData.status,
      };
      if (id) {
        await api.put(`/job/update/${id}`, payload);
        toast.success("Job updated successfully");
      } else {
        await api.post("/job/create", payload);
        toast.success("Job posted successfully");
      }
      navigate("/job-postings");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-100">
      {sideNavComponent}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="animate-fade-in-down">
            <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
              {id ? "Edit Job" : "Post a New Job"}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {id ? "Update the job details below" : "Create a new opening to share on your career portal"}
            </p>
          </div>

          {prefillLoading ? (
            <div className="card-surface space-y-4 p-6 lg:p-8 animate-fade-in">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="skeleton h-[68px] w-full" />
                <div className="skeleton h-[68px] w-full" />
                <div className="skeleton h-[68px] w-full" />
                <div className="skeleton h-[68px] w-full" />
                <div className="skeleton h-[68px] w-full" />
                <div className="skeleton h-[68px] w-full" />
              </div>
              <div className="skeleton h-36 w-full" />
              <div className="skeleton h-28 w-full" />
              <div className="skeleton h-28 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card-surface p-6 lg:p-8 animate-fade-in-up">
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputBox label="Job Title" id="title" placeholder="Enter job title" name="title" setInput={set("title")} getInput={formData.title} />
                  <InputBox label="Location" id="location" placeholder="Enter location" name="location" setInput={set("location")} getInput={formData.location} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectBox label="Department" id="department" name="department" setInput={set("department")} getInput={formData.department} option={departments.map((d) => ({ label: d.name, value: d._id }))} />
                  <SelectBox label="Employment Type" id="employmentType" name="employmentType" setInput={set("employmentType")} getInput={formData.employmentType} option={jobTypeOptions} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputBox label="Salary (display)" id="salary" placeholder="e.g. ₹8-12 LPA" name="salary" setInput={set("salary")} getInput={formData.salary} />
                  <InputBox label="Salary min (₹/yr)" id="salaryMin" placeholder="800000" name="salaryMin" setInput={set("salaryMin")} getInput={formData.salaryMin} />
                  <InputBox label="Salary max (₹/yr)" id="salaryMax" placeholder="1200000" name="salaryMax" setInput={set("salaryMax")} getInput={formData.salaryMax} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputBox label="Skills" id="skills" placeholder="Comma-separated skills" name="skills" setInput={set("skills")} getInput={formData.skills} />
                  <SelectBox label="Experience" id="experience" name="experience" setInput={set("experience")} getInput={formData.experience} option={experienceOptions} />
                  <InputBox label="Openings" id="openings" placeholder="1" name="openings" setInput={set("openings")} getInput={formData.openings} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputBox label="Last application date" id="lastDate" type="date" name="lastDate" setInput={set("lastDate")} getInput={formData.lastDate} />
                  <SelectBox label="Status" id="status" name="status" setInput={set("status")} getInput={formData.status} option={statusOptions} />
                </div>
                <TextArea label="Job Description" id="description" placeholder="Enter detailed job description" name="description" value={formData.description} onChange={(e) => set("description")(e.target.value)} rows={6} />
                <TextArea label="Responsibilities" id="responsibilities" placeholder="One responsibility per line" name="responsibilities" value={formData.responsibilities} onChange={(e) => set("responsibilities")(e.target.value)} rows={4} />
                <TextArea label="Qualifications" id="qualifications" placeholder="One qualification per line" name="qualifications" value={formData.qualifications} onChange={(e) => set("qualifications")(e.target.value)} rows={4} />
              </div>

              <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex flex-col-reverse gap-3 rounded-b-2xl border-t border-ink-100 bg-white/95 px-6 py-4 backdrop-blur sm:flex-row sm:justify-end lg:-mx-8 lg:-mb-8 lg:px-8 dark:bg-ink-200/95 dark:border-ink-700/40">
                <Button variant="secondary" label="Cancel" onClick={() => navigate("/job-postings")} />
                <Button type="submit" label={loading ? (id ? "Saving..." : "Posting...") : id ? "Save Changes" : "Post Job"} loading={loading} />
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default Job_post_form;
