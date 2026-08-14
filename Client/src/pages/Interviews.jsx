import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { api } from "../utils/api";
import Button from "../components/Button";
import InputBox from "../components/InputBox";
import TextArea from "../components/TextArea";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";
import { ArrowUpRight, X } from "lucide-react";

const initialForm = {
  candidate: "",
  job: "",
  application: "",
  interviewDate: "",
  duration: "60",
  round: "Round 1",
  mode: "Video Call",
  meetingLink: "",
  type: "Technical",
  notes: "",
};

const selectChevron = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a94a6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
};

const Interviews = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.user?.role;
  const canManage = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(
    role,
  );

  const SideNav = (r) => {
    if (r === "developer" || r === "Employee" || r === "Interviewer")
      return <SideNavbar />;
    if (canManage) return <HRSideNavber />;
    return null;
  };

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [appsByJob, setAppsByJob] = useState([]);
  const [panel, setPanel] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [feedbackFor, setFeedbackFor] = useState(null);
  const [feedback, setFeedback] = useState({
    rating: 3,
    result: "",
    status: "Completed",
    feedback: "",
  });

  const fetchInterviews = useCallback(async () => {
    try {
      const res = await api.get("/interview/all");
      setInterviews(res.data.data.data || []);
    } catch {
      toast.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  useEffect(() => {
    if (!showForm) return;
    api
      .get("/candidate/all", { params: { limit: 100 } })
      .then((r) => setCandidates(r.data.data.data || []));
    api
      .get("/job/all", { params: { limit: 100 } })
      .then((r) => setJobs(r.data.data.data || []));
  }, [showForm]);

  useEffect(() => {
    if (!formData.job) {
      setAppsByJob([]);
      return;
    }
    api
      .get(`/application/by-job/${formData.job}`, { params: { limit: 100 } })
      .then((r) => setAppsByJob(r.data.data?.data || r.data.data || []))
      .catch(() => setAppsByJob([]));
  }, [formData.job]);

  const searchEmployees = async (e) => {
    const q = e.target.value;
    setSearch(q);
    setShowResults(true);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get("/interview/employees/search", {
        params: { q },
      });
      setSearchResults(res.data.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const togglePanel = (emp) => {
    setPanel((p) =>
      p.some((x) => x._id === emp._id)
        ? p.filter((x) => x._id !== emp._id)
        : [...p, emp],
    );
    setSearch("");
    setSearchResults([]);
  };

  const set = (key) => (v) => setFormData((p) => ({ ...p, [key]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.candidate || !formData.job || !formData.interviewDate) {
      toast.error("Candidate, job and interview date are required");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/interview/create", {
        ...formData,
        duration: Number(formData.duration),
        panel: panel.map((p) => p._id),
      });
      toast.success("Interview scheduled");
      setShowForm(false);
      setFormData(initialForm);
      setPanel([]);
      fetchInterviews();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to schedule interview",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/interview/feedback/${feedbackFor._id}`, feedback);
      toast.success("Feedback saved");
      setFeedbackFor(null);
      fetchInterviews();
    } catch {
      toast.error("Failed to save feedback");
    }
  };

  const upcoming = interviews
    .filter((i) => i.status === "Scheduled")
    .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));
  const past = interviews.filter((i) => i.status !== "Scheduled");

  const avatar = (c) => `${c?.firstName?.[0] || ""}${c?.lastName?.[0] || ""}`;

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-down">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
                Interviews
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                Schedule and manage interviews
              </p>
            </div>
            {canManage && (
              <Button
                label="+ Schedule Interview"
                onClick={() => setShowForm((v) => !v)}
              />
            )}
          </div>

          {showForm && canManage && (
            <form
              onSubmit={handleSubmit}
              className="card-surface mb-6 p-6 animate-fade-in-down"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-ink-950">
                    Schedule new interview
                  </h2>
                  <p className="mt-0.5 text-xs text-ink-400">
                    Coordinate rounds, panel and meeting details
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  aria-label="Close form"
                  className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors duration-200 hover:bg-surface-100 hover:text-ink-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="candidate"
                    className="text-[13px] font-semibold text-ink-800"
                  >
                    Candidate
                  </label>
                  <select
                    id="candidate"
                    value={formData.candidate}
                    onChange={(e) => set("candidate")(e.target.value)}
                    className="input-base appearance-none cursor-pointer pr-10"
                    style={selectChevron}
                  >
                    <option value="">Select candidate</option>
                    {candidates.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="job"
                    className="text-[13px] font-semibold text-ink-800"
                  >
                    Job
                  </label>
                  <select
                    id="job"
                    value={formData.job}
                    onChange={(e) => {
                      set("job")(e.target.value);
                      set("application")("");
                    }}
                    className="input-base appearance-none cursor-pointer pr-10"
                    style={selectChevron}
                  >
                    <option value="">Select job</option>
                    {jobs.map((j) => (
                      <option key={j._id} value={j._id}>
                        {j.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="application"
                    className="text-[13px] font-semibold text-ink-800"
                  >
                    Application (optional)
                  </label>
                  <select
                    id="application"
                    value={formData.application}
                    onChange={(e) => set("application")(e.target.value)}
                    className="input-base appearance-none cursor-pointer pr-10"
                    style={selectChevron}
                  >
                    <option value="">— link to application —</option>
                    {appsByJob.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.candidate?.firstName} {a.candidate?.lastName} (
                        {a.status})
                      </option>
                    ))}
                  </select>
                </div>
                <InputBox
                  label="Date & time"
                  type="datetime-local"
                  id="interviewDate"
                  name="interviewDate"
                  setInput={set("interviewDate")}
                  getInput={formData.interviewDate}
                />
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="duration"
                    className="text-[13px] font-semibold text-ink-800"
                  >
                    Duration (min)
                  </label>
                  <select
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => set("duration")(e.target.value)}
                    className="input-base appearance-none cursor-pointer pr-10"
                    style={selectChevron}
                  >
                    {["30", "45", "60", "90", "120"].map((d) => (
                      <option key={d} value={d}>
                        {d} min
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="round"
                    className="text-[13px] font-semibold text-ink-800"
                  >
                    Round
                  </label>
                  <select
                    id="round"
                    value={formData.round}
                    onChange={(e) => set("round")(e.target.value)}
                    className="input-base appearance-none cursor-pointer pr-10"
                    style={selectChevron}
                  >
                    {["Round 1", "Round 2", "Round 3", "Final"].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="mode"
                    className="text-[13px] font-semibold text-ink-800"
                  >
                    Mode
                  </label>
                  <select
                    id="mode"
                    value={formData.mode}
                    onChange={(e) => set("mode")(e.target.value)}
                    className="input-base appearance-none cursor-pointer pr-10"
                    style={selectChevron}
                  >
                    {[
                      "Video Call",
                      "In-person",
                      "Phone",
                      "Online",
                      "Offline",
                    ].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="type"
                    className="text-[13px] font-semibold text-ink-800"
                  >
                    Type
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => set("type")(e.target.value)}
                    className="input-base appearance-none cursor-pointer pr-10"
                    style={selectChevron}
                  >
                    {["Technical", "HR", "Managerial", "Final"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <InputBox
                  label="Meeting link"
                  id="meetingLink"
                  placeholder="https://meet.google.com/..."
                  name="meetingLink"
                  setInput={set("meetingLink")}
                  getInput={formData.meetingLink}
                />
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-[13px] font-semibold text-ink-800">
                  Interview panel
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={searchEmployees}
                    onFocus={() => setShowResults(true)}
                    placeholder="Search employees to add to panel..."
                    className="input-base"
                  />
                  {showResults && (search || searching) && (
                    <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto scrollbar-thin rounded-xl border border-ink-200/60 bg-white p-1 shadow-popover animate-fade-in">
                      {searching ? (
                        <div className="p-3 text-xs text-ink-400">
                          Searching...
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-3 text-xs text-ink-400">
                          No employees found
                        </div>
                      ) : (
                        searchResults.map((emp) => (
                          <button
                            type="button"
                            key={emp._id}
                            onClick={() => togglePanel(emp)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-200 hover:bg-surface-100"
                          >
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-[10px] font-semibold text-brand-600">
                              {emp.name?.[0]}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-ink-800">
                                {emp.name}
                              </p>
                              <p className="text-[10px] text-ink-400">
                                {emp.designation || emp.role || ""}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {panel.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {panel.map((emp) => (
                      <span
                        key={emp._id}
                        className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-500/20"
                      >
                        {emp.name}
                        <button
                          type="button"
                          onClick={() => togglePanel(emp)}
                          aria-label={`Remove ${emp.name} from panel`}
                          className="text-brand-400 transition-colors duration-200 hover:text-brand-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <TextArea
                  label="Notes"
                  id="notes"
                  placeholder="Preparation notes, topics to cover..."
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => set("notes")(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  type="submit"
                  label="Schedule Interview"
                  loading={submitting}
                  disabled={submitting}
                />
              </div>
            </form>
          )}

          {loading ? (
            <SkeletonList rows={4} />
          ) : interviews.length === 0 ? (
            <div className="card-surface animate-fade-in">
              <EmptyState
                title="No interviews yet"
                description="Schedule your first interview to get started."
              />
            </div>
          ) : (
            <>
              <section className="mb-8 animate-fade-in-up">
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-ink-800">
                    Upcoming
                  </h2>
                  <span className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-500/20">
                    {upcoming.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {upcoming.length === 0 && (
                    <p className="text-xs text-ink-400">
                      No upcoming interviews
                    </p>
                  )}
                  {upcoming.map((iv) => (
                    <div
                      key={iv._id}
                      className="card-surface card-hover p-5"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-500/20">
                          {iv.status}
                        </span>
                        <span className="text-[10px] font-medium text-ink-400">
                          {new Date(iv.interviewDate).toLocaleDateString(
                            undefined,
                            { weekday: "short", month: "short", day: "numeric" },
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">
                          {avatar(iv.candidate)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-medium text-ink-900">
                            {iv.candidate?.firstName} {iv.candidate?.lastName}
                          </h3>
                          <p className="truncate text-[11px] text-ink-500">
                            {iv.job?.title}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5 text-[10px]">
                        <span className="chip bg-surface-100 text-ink-600 ring-1 ring-ink-200/60">
                          {iv.round} · {iv.type}
                        </span>
                        <span className="chip bg-surface-100 text-ink-600 ring-1 ring-ink-200/60">
                          {iv.mode} · {iv.duration}m
                        </span>
                      </div>
                      <div className="mt-3">
                        <p className="mb-1.5 text-[10px] text-ink-400">
                          Panel ({iv.panel?.length || 0})
                        </p>
                        <div className="flex -space-x-2">
                          {iv.panel?.map((p, i) => (
                            <div
                              key={i}
                              title={p.name}
                              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-surface-200 text-[9px] font-semibold text-ink-500"
                            >
                              {p.name?.[0]}
                            </div>
                          ))}
                        </div>
                      </div>
                      {iv.meetingLink && (
                        <a
                          href={iv.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-brand-600 transition-colors duration-200 hover:text-brand-700"
                        >
                          Join meeting
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="animate-fade-in-up">
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-ink-800">
                    Past / Completed
                  </h2>
                  <span className="chip bg-surface-100 text-ink-600 ring-1 ring-ink-200/60">
                    {past.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {past.length === 0 && (
                    <p className="text-xs text-ink-400">No past interviews</p>
                  )}
                  {past.map((iv) => (
                    <div
                      key={iv._id}
                      className="card-surface p-5 opacity-90"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span
                          className={`chip ring-1 ${iv.status === "Cancelled" ? "bg-red-50 text-red-600 ring-red-500/20" : "bg-ink-100 text-ink-600 ring-ink-500/15"}`}
                        >
                          {iv.status}
                        </span>
                        <span className="text-[10px] font-medium text-ink-400">
                          {new Date(iv.interviewDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-200 text-xs font-semibold text-ink-500">
                          {avatar(iv.candidate)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-medium text-ink-900">
                            {iv.candidate?.firstName} {iv.candidate?.lastName}
                          </h3>
                          <p className="truncate text-[11px] text-ink-500">
                            {iv.job?.title}
                          </p>
                        </div>
                      </div>
                      {iv.result && (
                        <span
                          className={`chip mt-3 inline-flex ring-1 ${iv.result === "Pass" ? "bg-green-50 text-green-600 ring-green-500/20" : iv.result === "Fail" ? "bg-red-50 text-red-600 ring-red-500/20" : "bg-yellow-50 text-yellow-600 ring-yellow-500/20"}`}
                        >
                          {iv.result}
                        </span>
                      )}
                      {canManage && iv.status !== "Cancelled" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          label={iv.feedback ? "Edit feedback" : "Add feedback"}
                          className="mt-4"
                          onClick={() => {
                            setFeedbackFor(iv);
                            setFeedback({
                              rating: iv.rating || 3,
                              result: iv.result || "",
                              status: "Completed",
                              feedback: iv.feedback || "",
                            });
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {feedbackFor && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
              onClick={() => setFeedbackFor(null)}
            >
              <form
                onSubmit={handleFeedbackSubmit}
                className="card-surface w-full max-w-md p-6 shadow-modal animate-scale-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-ink-950">
                    Interview feedback
                  </h2>
                  <button
                    type="button"
                    onClick={() => setFeedbackFor(null)}
                    aria-label="Close feedback"
                    className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors duration-200 hover:bg-surface-100 hover:text-ink-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-700">
                      Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() =>
                            setFeedback((f) => ({ ...f, rating: r }))
                          }
                          aria-label={`Rate ${r} of 5`}
                          className={`text-xl transition-all duration-200 active:scale-90 ${r <= feedback.rating ? "text-amber-400" : "text-ink-200 hover:text-amber-300"}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-ink-700">
                        Result
                      </label>
                      <select
                        value={feedback.result}
                        onChange={(e) =>
                          setFeedback((f) => ({ ...f, result: e.target.value }))
                        }
                        className="input-base appearance-none cursor-pointer pr-10"
                        style={selectChevron}
                      >
                        <option value="">—</option>
                        <option>Pass</option>
                        <option>Fail</option>
                        <option>Hold</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-ink-700">
                        Status
                      </label>
                      <select
                        value={feedback.status}
                        onChange={(e) =>
                          setFeedback((f) => ({ ...f, status: e.target.value }))
                        }
                        className="input-base appearance-none cursor-pointer pr-10"
                        style={selectChevron}
                      >
                        <option>Completed</option>
                        <option>Rescheduled</option>
                        <option>Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <TextArea
                    label="Feedback"
                    id="feedback"
                    placeholder="Detailed feedback..."
                    name="feedback"
                    value={feedback.feedback}
                    onChange={(e) =>
                      setFeedback((f) => ({ ...f, feedback: e.target.value }))
                    }
                    rows={4}
                  />
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    label="Cancel"
                    onClick={() => setFeedbackFor(null)}
                  />
                  <Button type="submit" size="sm" label="Save feedback" />
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Interviews;
