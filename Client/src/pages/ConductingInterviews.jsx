import { useState, useEffect } from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api } from "../utils/api";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";
import { X } from "lucide-react";

const statusColors = {
  Scheduled: "bg-purple-50 text-purple-700",
  Completed: "bg-green-50 text-green-700",
  Cancelled: "bg-red-50 text-red-600",
  Rescheduled: "bg-yellow-50 text-yellow-700",
};

const hrRoles = ["Company Admin", "HR", "HR Manager", "Recruiter"];

const candidateName = (candidate) =>
  candidate?.name || [candidate?.firstName, candidate?.lastName].filter(Boolean).join(" ") || "Unknown";

const candidateInitials = (candidate) => {
  const name = candidateName(candidate);
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("") || "?";
};

const ConductingInterviews = () => {
  const { user } = useSelector((state) => state.auth);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Scheduled");
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackData, setFeedbackData] = useState({ rating: 3, feedback: "" });

  const SideNav = (r) => (hrRoles.includes(r) ? <HRSideNavber /> : <SideNavbar />);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.get("/interview/all");
      setInterviews(res.data.data?.data || []);
    } catch {
      toast.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterviews(); }, []);

  const openFeedback = (int) => {
    setFeedbackData({ feedback: int.feedback || "", rating: int.rating || 3 });
    setFeedbackModal(int._id);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/interview/feedback/${feedbackModal}`, {
        rating: feedbackData.rating,
        feedback: feedbackData.feedback,
      });
      toast.success("Feedback submitted");
      setFeedbackModal(null);
      fetchInterviews();
    } catch {
      toast.error("Failed to submit feedback");
    }
  };

  const filteredInterviews = interviews.filter((int) => {
    if (filter === "All") return true;
    return int.status === filter;
  });

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(user?.user?.role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-down">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
                Conducting Interviews
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                Run your scheduled interviews and capture candidate feedback
              </p>
            </div>
            <div className="flex gap-1.5 rounded-xl bg-surface-100 p-1 ring-1 ring-ink-200/60">
              {["Scheduled", "Completed", "Cancelled", "All"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 focus-ring ${
                    filter === f
                      ? "bg-white text-ink-900 shadow-sm ring-1 ring-ink-200/60"
                      : "text-ink-500 hover:text-ink-800"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <SkeletonList rows={4} />
          ) : filteredInterviews.length === 0 ? (
            <div className="card-surface animate-fade-in">
              <EmptyState
                title={`No ${filter.toLowerCase()} interviews found`}
                description="Interviews you are responsible for will show up here."
              />
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in-up">
              {filteredInterviews.map((int) => (
                <div key={int._id} className="card-surface card-hover p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
                        {candidateInitials(int.candidate)}
                      </div>
                      <div>
                        <h3 className="font-medium text-ink-900">{candidateName(int.candidate)}</h3>
                        <p className="text-xs text-ink-500">{int.candidate?.email}</p>
                        <p className="mt-0.5 text-xs text-ink-400">{int.job?.title} &middot; {int.type}</p>
                        <p className="text-xs text-ink-400">
                          {new Date(int.interviewDate).toLocaleString()}
                          &middot; {int.mode}
                        </p>
                        {int.panel?.length > 0 && (
                          <p className="text-xs text-ink-400">
                            Panel: {int.panel.map((p) => p.name).filter(Boolean).join(", ")}
                          </p>
                        )}
                        {int.feedback && (
                          <div className="mt-1.5 inline-block rounded-lg bg-surface-100 p-2 text-xs text-ink-600 ring-1 ring-ink-200/60">
                            &quot;{int.feedback}&quot;
                            {int.rating && <span className="ml-2 text-yellow-500">{'★'.repeat(int.rating)}{'☆'.repeat(5 - int.rating)}</span>}
                          </div>
                        )}
                        {int.result && (
                          <span className={`chip mt-1 inline-flex ring-1 ${int.result === "Pass" ? "bg-green-50 text-green-700 ring-green-500/20" : int.result === "Fail" ? "bg-red-50 text-red-600 ring-red-500/20" : "bg-yellow-50 text-yellow-700 ring-yellow-500/20"}`}>
                            {int.result}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className={`chip ring-1 ring-ink-950/5 ${statusColors[int.status] || "bg-ink-50 text-ink-600"}`}>
                        {int.status}
                      </span>
                      {int.status !== "Completed" && (
                        <button
                          onClick={() => openFeedback(int)}
                          className="btn-primary btn-sm"
                        >
                          Add Feedback
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {feedbackModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm" onClick={() => setFeedbackModal(null)}>
              <div className="card-surface w-full max-w-lg p-6 shadow-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-ink-950">Interview Feedback</h2>
                    <p className="mt-0.5 text-xs text-ink-400">Rate and note the candidate&apos;s performance</p>
                  </div>
                  <button
                    onClick={() => setFeedbackModal(null)}
                    aria-label="Close feedback"
                    className="focus-ring flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors duration-200 hover:bg-surface-100 hover:text-ink-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="feedback" className="mb-1 block text-xs font-medium text-ink-600">Feedback</label>
                    <textarea id="feedback" value={feedbackData.feedback} onChange={(e) => setFeedbackData((p) => ({ ...p, feedback: e.target.value }))} rows={4} className="input-base resize-none" placeholder="Detailed feedback about the candidate..." required />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-600">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFeedbackData((p) => ({ ...p, rating: r }))}
                          aria-label={`Rate ${r} of 5`}
                          className={`h-9 w-9 rounded-lg text-sm font-medium transition-all duration-200 active:scale-90 focus-ring ${
                            feedbackData.rating >= r
                              ? "bg-brand-600 text-white shadow-sm shadow-brand-600/25"
                              : "bg-surface-100 text-ink-400 ring-1 ring-ink-200/60 hover:text-ink-600"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="btn-primary btn-md">Submit</button>
                    <button type="button" onClick={() => setFeedbackModal(null)} className="btn-secondary btn-md">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ConductingInterviews;
