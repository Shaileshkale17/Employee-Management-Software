import { useState, useEffect } from "react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api } from "../utils/api";

const statusColors = {
  Scheduled: "bg-blue-50 text-blue-700",
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
    <div className="flex">
      {SideNav(user?.user?.role)}
      <div className="flex-1 min-h-screen p-6 bg-surface-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-xl font-bold text-gray-900">Conducting Interviews</h1>
          <div className="flex gap-2">
            {["Scheduled", "Completed", "Cancelled", "All"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-brand-600 text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : filteredInterviews.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-sm">No {filter.toLowerCase()} interviews found</div>
        ) : (
          <div className="space-y-3">
            {filteredInterviews.map((int) => (
              <div key={int._id} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 hover:shadow-card-hover transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-semibold text-sm flex-shrink-0">
                      {candidateInitials(int.candidate)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{candidateName(int.candidate)}</h3>
                      <p className="text-xs text-gray-500">{int.candidate?.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{int.job?.title} &middot; {int.type}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(int.interviewDate).toLocaleString()}
                        &middot; {int.mode}
                      </p>
                      {int.panel?.length > 0 && (
                        <p className="text-xs text-gray-400">
                          Panel: {int.panel.map((p) => p.name).filter(Boolean).join(", ")}
                        </p>
                      )}
                      {int.feedback && (
                        <div className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg p-2 inline-block">
                          &quot;{int.feedback}&quot;
                          {int.rating && <span className="ml-2 text-yellow-500">{'★'.repeat(int.rating)}{'☆'.repeat(5 - int.rating)}</span>}
                        </div>
                      )}
                      {int.result && (
                        <span className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${int.result === "Pass" ? "bg-green-50 text-green-700" : int.result === "Fail" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-700"}`}>
                          {int.result}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[int.status] || "bg-gray-50 text-gray-600"}`}>
                      {int.status}
                    </span>
                    {int.status !== "Completed" && (
                      <button onClick={() => openFeedback(int)} className="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-brand-700 transition-colors">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setFeedbackModal(null)}>
            <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Feedback</h2>
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Feedback</label>
                  <textarea value={feedbackData.feedback} onChange={(e) => setFeedbackData((p) => ({ ...p, feedback: e.target.value }))} rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none" placeholder="Detailed feedback about the candidate..." required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button key={r} type="button" onClick={() => setFeedbackData((p) => ({ ...p, rating: r }))} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${feedbackData.rating >= r ? "bg-yellow-100 text-yellow-700 border border-yellow-200" : "bg-gray-50 text-gray-300 border border-gray-100"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="bg-brand-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">Submit</button>
                  <button type="button" onClick={() => setFeedbackModal(null)} className="bg-white text-gray-600 px-5 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConductingInterviews;
