import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { api } from "../utils/api";
import Button from "../components/Button";
import InputBox from "../components/InputBox";
import TextArea from "../components/TextArea";
import Heading from "../components/Heading";
import { SkeletonList } from "../components/Skeleton";

const CompanySettings = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.user?.role;
  const canManage = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(role);
  const SideNav = (r) => {
    if (r === "developer" || r === "Employee" || r === "Interviewer") return <SideNavbar />;
    if (canManage) return <HRSideNavber />;
    return null;
  };

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    size: "",
    website: "",
    address: "",
    gst: "",
    contactPerson: "",
    phone: "",
  });
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/company/profile"), api.get("/company/departments")])
      .then(([profileRes, deptRes]) => {
        const c = profileRes.data.data;
        setFormData({
          name: c.name || "",
          industry: c.industry || "",
          size: c.size || "",
          website: c.website || "",
          address: c.address || "",
          gst: c.gst || "",
          contactPerson: c.contactPerson || "",
          phone: c.phone || "",
        });
        setDepartments(deptRes.data.data || []);
      })
      .catch(() => toast.error("Failed to load company profile"))
      .finally(() => setLoading(false));
  }, []);

  const set = (key) => (v) => setFormData((p) => ({ ...p, [key]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/company/profile", formData);
      setFormData((p) => ({ ...p, name: res.data.data.name }));
      toast.success("Company profile updated");
    } catch {
      toast.error("Failed to update company profile");
    } finally {
      setSaving(false);
    }
  };

  const addDepartment = async (e) => {
    e.preventDefault();
    if (!newDept.trim()) return;
    try {
      const res = await api.post("/company/departments", { name: newDept.trim() });
      setDepartments((d) => [...d, res.data.data]);
      setNewDept("");
      toast.success("Department added");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add department");
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="animate-fade-in-down">
            <Heading heading="Company Settings" subtitle="Manage your workspace profile and departments" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in">
              <div className="lg:col-span-2 card-surface p-5 sm:p-6 space-y-5">
                <SkeletonList rows={3} />
              </div>
              <div className="card-surface p-5 sm:p-6 h-fit">
                <SkeletonList rows={3} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <form onSubmit={handleSave} className="lg:col-span-2 card-surface p-5 sm:p-6 space-y-4 animate-fade-in-up">
                <div>
                  <h2 className="text-sm font-semibold text-ink-950">Company Profile</h2>
                  <p className="text-xs text-ink-400 mt-0.5">Update your company details shown to employees</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputBox label="Company name" id="name" placeholder="Acme Inc." name="name" setInput={set("name")} getInput={formData.name} />
                  <InputBox label="Industry" id="industry" placeholder="Technology" name="industry" setInput={set("industry")} getInput={formData.industry} />
                  <InputBox label="Company size" id="size" placeholder="11-50" name="size" setInput={set("size")} getInput={formData.size} />
                  <InputBox label="Website" id="website" placeholder="https://acme.com" name="website" setInput={set("website")} getInput={formData.website} />
                  <InputBox label="Contact person" id="contactPerson" placeholder="John Smith" name="contactPerson" setInput={set("contactPerson")} getInput={formData.contactPerson} />
                  <InputBox label="Phone" id="phone" placeholder="+91 ..." name="phone" setInput={set("phone")} getInput={formData.phone} />
                  <InputBox label="GST Number" id="gst" placeholder="27AAAAA0000A1Z5" name="gst" setInput={set("gst")} getInput={formData.gst} />
                </div>
                <TextArea label="Address" id="address" placeholder="Full address" name="address" value={formData.address} onChange={(e) => set("address")(e.target.value)} rows={3} />
                <div className="flex justify-end pt-1">
                  <Button type="submit" label="Save changes" loading={saving} disabled={saving} />
                </div>
              </form>

              <div className="card-surface p-5 sm:p-6 h-fit animate-fade-in-up">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-ink-950">Departments</h2>
                  <p className="text-xs text-ink-400 mt-0.5">Add departments for your organisation</p>
                </div>
                <form onSubmit={addDepartment} className="flex gap-2 mb-4">
                  <input
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    placeholder="Add department..."
                    aria-label="New department name"
                    className="input-base flex-1 px-4"
                  />
                  <Button type="submit" size="sm" label="Add" />
                </form>
                <div className="space-y-1.5">
                  {departments.map((d) => (
                    <div key={d._id} className="flex items-center justify-between bg-surface-100/80 rounded-lg px-3 py-2 ring-1 ring-ink-200/50">
                      <span className="text-sm text-ink-700 font-medium">{d.name}</span>
                      <span className="text-[10px] text-ink-400">{d.description || ""}</span>
                    </div>
                  ))}
                  {departments.length === 0 && <p className="text-xs text-ink-400 text-center py-3">No departments yet</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CompanySettings;
