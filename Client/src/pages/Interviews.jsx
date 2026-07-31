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

const Interviews = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.user?.role;
  const canManage = ["Company Admin", "HR", "HR Manager", "Recruiter"].includes(
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
    <div className="flex">
      {SideNav(role)}
      <div className="flex-1 min-h-screen p-4 lg:p-6 bg-surface-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Interviews</h1>
            <p className="text-sm text-gray-400 mt-0.5">
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
            className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 mb-6 animate-fadeIn"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Schedule new interview
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Candidate
                </label>
                <select
                  value={formData.candidate}
                  onChange={(e) => set("candidate")(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                <label className="text-sm font-semibold text-gray-700">
                  Job
                </label>
                <select
                  value={formData.job}
                  onChange={(e) => {
                    set("job")(e.target.value);
                    set("application")("");
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                <label className="text-sm font-semibold text-gray-700">
                  Application (optional)
                </label>
                <select
                  value={formData.application}
                  onChange={(e) => set("application")(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                <label className="text-sm font-semibold text-gray-700">
                  Duration (min)
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => set("duration")(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                >
                  {["30", "45", "60", "90", "120"].map((d) => (
                    <option key={d} value={d}>
                      {d} min
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Round
                </label>
                <select
                  value={formData.round}
                  onChange={(e) => set("round")(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                >
                  {["Round 1", "Round 2", "Round 3", "Final"].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Mode
                </label>
                <select
                  value={formData.mode}
                  onChange={(e) => set("mode")(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
                <label className="text-sm font-semibold text-gray-700">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => set("type")(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                Interview panel
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={searchEmployees}
                  onFocus={() => setShowResults(true)}
                  placeholder="Search employees to add to panel..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
                {showResults && (search || searching) && (
                  <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-modal max-h-52 overflow-y-auto">
                    {searching ? (
                      <div className="p-3 text-xs text-gray-400">
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-xs text-gray-400">
                        No employees found
                      </div>
                    ) : (
                      searchResults.map((emp) => (
                        <button
                          type="button"
                          key={emp._id}
                          onClick={() => togglePanel(emp)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-100 transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-[10px] font-semibold">
                            {emp.name?.[0]}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-800">
                              {emp.name}
                            </p>
                            <p className="text-[10px] text-gray-400">
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
                <div className="flex flex-wrap gap-2 mt-3">
                  {panel.map((emp) => (
                    <span
                      key={emp._id}
                      className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs px-2.5 py-1 rounded-full"
                    >
                      {emp.name}
                      <button
                        type="button"
                        onClick={() => togglePanel(emp)}
                        className="text-brand-400 hover:text-brand-700"
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
          <div className="bg-white rounded-2xl shadow-card border border-gray-100">
            <EmptyState
              title="No interviews yet"
              description="Schedule your first interview to get started."
            />
          </div>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Upcoming
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {upcoming.length === 0 && (
                  <p className="text-xs text-gray-400">
                    No upcoming interviews
                  </p>
                )}
                {upcoming.map((iv) => (
                  <div
                    key={iv._id}
                    className="bg-white rounded-2xl shadow-card border border-gray-100 p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-1 rounded-full font-medium">
                        {iv.status}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(iv.interviewDate).toLocaleDateString(
                          undefined,
                          { weekday: "short", month: "short", day: "numeric" },
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-xs">
                        {avatar(iv.candidate)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {iv.candidate?.firstName} {iv.candidate?.lastName}
                        </h3>
                        <p className="text-[11px] text-gray-500 truncate">
                          {iv.job?.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-4 text-[10px]">
                      <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">
                        {iv.round} · {iv.type}
                      </span>
                      <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">
                        {iv.mode} · {iv.duration}m
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-[10px] text-gray-400 mb-1.5">
                        Panel ({iv.panel?.length || 0})
                      </p>
                      <div className="flex -space-x-2">
                        {iv.panel?.map((p, i) => (
                          <div
                            key={i}
                            title={p.name}
                            className="w-7 h-7 rounded-full bg-surface-200 border-2 border-white flex items-center justify-center text-[9px] font-semibold text-gray-500"
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
                        className="inline-flex items-center gap-1.5 text-[11px] text-brand-600 hover:text-brand-700 mt-3 font-medium"
                      >
                        Join meeting
                        <svg
                          className="w-3 h-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M7 17L17 7M7 7h10v10" />
                        </svg>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Past / Completed
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {past.length === 0 && (
                  <p className="text-xs text-gray-400">No past interviews</p>
                )}
                {past.map((iv) => (
                  <div
                    key={iv._id}
                    className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 opacity-90"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-medium ${iv.status === "Cancelled" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600"}`}
                      >
                        {iv.status}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(iv.interviewDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-gray-500 font-semibold text-xs">
                        {avatar(iv.candidate)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {iv.candidate?.firstName} {iv.candidate?.lastName}
                        </h3>
                        <p className="text-[11px] text-gray-500 truncate">
                          {iv.job?.title}
                        </p>
                      </div>
                    </div>
                    {iv.result && (
                      <span
                        className={`inline-block text-[10px] mt-3 px-2 py-0.5 rounded-full font-medium ${iv.result === "Pass" ? "bg-green-50 text-green-600" : iv.result === "Fail" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-600"}`}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setFeedbackFor(null)}
          >
            <form
              onSubmit={handleFeedbackSubmit}
              className="bg-white rounded-2xl shadow-modal w-full max-w-md mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Interview feedback
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
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
                        className={`text-xl transition-colors ${r <= feedback.rating ? "text-amber-400" : "text-gray-200"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Result
                    </label>
                    <select
                      value={feedback.result}
                      onChange={(e) =>
                        setFeedback((f) => ({ ...f, result: e.target.value }))
                      }
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand-500"
                    >
                      <option value="">—</option>
                      <option>Pass</option>
                      <option>Fail</option>
                      <option>Hold</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Status
                    </label>
                    <select
                      value={feedback.status}
                      onChange={(e) =>
                        setFeedback((f) => ({ ...f, status: e.target.value }))
                      }
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand-500"
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
              <div className="flex justify-end gap-2 mt-5">
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
    </div>
  );
};

export default Interviews;
