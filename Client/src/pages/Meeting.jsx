import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import Heading from "../components/Heading";
import Button from "../components/Button";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import InputBox from "../components/InputBox";
import SelectBox from "../components/SelectBox";
import MeetingCard from "../components/meeting/MeetingCard";
import MeetingCreateModal from "../components/meeting/MeetingCreateModal";
import GuestInviteModal from "../components/meeting/GuestInviteModal";
import { getToken, SOCKET_URL, api } from "../utils/api";
import {
  loadMeetings,
  loadDashboard,
  loadAnalytics,
  loadPersonalRoom,
  createNewMeeting,
  cancelExistingMeeting,
  deleteExistingMeeting,
  startExistingMeeting,
  endExistingMeeting,
} from "../redux/slices/meetingSlice";
import {
  TextAlignJustify,
  Clock,
  Calendar,
  Radio,
  CircleCheck,
  Radar,
  Users,
  User,
  Video,
  Link,
} from "lucide-react";

const HR_ROLES = [
  "Super Admin",
  "Company Admin",
  "HR",
  "HR Manager",
  "Recruiter",
];

const TABS = [
  { key: "", label: "All", icon: TextAlignJustify },
  {
    key: "upcoming",
    label: "Upcoming",
    icon: Clock,
  },
  {
    key: "today",
    label: "Today",
    icon: Calendar,
  },
  {
    key: "live",
    label: "Live",
    icon: Radio,
  },
  {
    key: "completed",
    label: "Completed",
    icon: CircleCheck,
  },
  {
    key: "missed",
    label: "Missed",
    icon: Radar,
  },
  {
    key: "interview",
    label: "Interviews",
    icon: Users,
  },
];

const STAT_CARDS = [
  {
    key: "total",
    label: "Total Meetings",
    icon: TextAlignJustify,
    tone: "from-brand-500 to-brand-700",
  },
  {
    key: "live",
    label: "Live Now",
    icon: Radio,
    tone: "from-emerald-500 to-emerald-600",
  },
  {
    key: "upcoming",
    label: "Upcoming",
    icon: Clock,
    tone: "from-indigo-500 to-indigo-700",
  },
  {
    key: "completed",
    label: "Completed",
    icon: CircleCheck,
    tone: "from-ink-500 to-ink-700",
  },
  {
    key: "interviews",
    label: "Interviews",
    icon: Users,
    tone: "from-purple-500 to-purple-700",
  },
  {
    key: "totalParticipants",
    label: "Participants",
    icon: User,
    tone: "from-amber-500 to-amber-600",
  },
];

const Meeting = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const role = user?.user?.role;
  const userId = user?.user?.id;
  const isHR = HR_ROLES.includes(role);

  const meetings = useSelector((state) => state.meeting.meetings);
  const total = useSelector((state) => state.meeting.total);
  const loading = useSelector((state) => state.meeting.loading);
  const dashboardLoading = useSelector(
    (state) => state.meeting.dashboardLoading,
  );
  const analytics = useSelector((state) => state.meeting.analytics);
  const personalRoom = useSelector((state) => state.meeting.personalRoom);

  const [tab, setTab] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [createType, setCreateType] = useState("scheduled");
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteMeeting, setInviteMeeting] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const socketRef = useRef(null);

  const loadAll = useCallback(() => {
    dispatch(loadMeetings({ tab, status, search, page, limit: 12 }));
  }, [dispatch, tab, status, search, page]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    dispatch(loadDashboard());
    dispatch(loadAnalytics());
    dispatch(loadPersonalRoom());
  }, [dispatch]);

  useEffect(() => {
    api
      .get("/emp/directory")
      .then((res) => setEmployees(res.data.data || []))
      .catch(() => {});
    api
      .get("/candidate/all")
      .then((res) => setCandidates(res.data.data.data || res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!userId) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("authenticate", { token: getToken() });
      socket.emit("register", String(userId));
    });
    socket.on("meeting:created", () => loadAll());
    socket.on("meeting:updated", () => loadAll());
    socket.on("meeting:started", () => {
      loadAll();
      dispatch(loadDashboard());
      dispatch(loadAnalytics());
    });
    socket.on("meeting:ended", () => {
      loadAll();
      dispatch(loadDashboard());
      dispatch(loadAnalytics());
    });
    socket.on("meeting:cancelled", () => loadAll());
    return () => {
      socket.off("meeting:created");
      socket.off("meeting:updated");
      socket.off("meeting:started");
      socket.off("meeting:ended");
      socket.off("meeting:cancelled");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, loadAll, dispatch]);

  const handleCreate = async (payload) => {
    const meeting = await dispatch(createNewMeeting(payload));
    dispatch(loadDashboard());
    dispatch(loadAnalytics());
    if (payload.type === "instant" || payload.type === "personal-room") {
      if (meeting?.meetingId) navigate(`/meeting/${meeting.meetingId}`);
    }
    return meeting;
  };

  const handleStart = async (meeting) => {
    try {
      const updated = await dispatch(startExistingMeeting(meeting._id));
      if (updated?.meetingId) navigate(`/meeting/${updated.meetingId}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to start meeting");
    }
  };

  const handleEnd = async (meeting) => {
    try {
      await dispatch(endExistingMeeting(meeting._id));
      toast.success("Meeting ended");
      dispatch(loadDashboard());
      dispatch(loadAnalytics());
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to end meeting");
    }
  };

  const handleJoin = async (meeting) => {
    navigate(`/meeting/${meeting.meetingId}`);
  };

  const handleOpen = (meeting) => {
    navigate(`/meeting/${meeting.meetingId}`);
  };

  const handleCancel = async (meeting) => {
    if (!window.confirm(`Cancel "${meeting.title}"?`)) return;
    try {
      await dispatch(cancelExistingMeeting(meeting._id));
      toast.success("Meeting cancelled");
      dispatch(loadDashboard());
      dispatch(loadAnalytics());
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel meeting");
    }
  };

  const handleDelete = async (meeting) => {
    try {
      await dispatch(deleteExistingMeeting(meeting._id));
      toast.success("Meeting deleted");
      dispatch(loadDashboard());
      dispatch(loadAnalytics());
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete meeting");
    }
  };

  const handleCopyLink = (meeting) => {
    const url = meeting.joinUrl;
    if (!url) {
      toast.error("No join link available");
      return;
    }
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Meeting link copied"))
      .catch(() => toast.error("Failed to copy link"));
  };

  const handleInvite = (meeting) => {
    setInviteMeeting(meeting);
    setInviteModal(true);
  };

  const canManage = (meeting) =>
    isHR ||
    String(meeting.organizer?._id || meeting.organizer) === String(userId);

  const menuRef = useRef(null);
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const statusOptions = [
    { value: "", label: "All statuses" },
    { value: "upcoming", label: "Upcoming" },
    { value: "live", label: "Live" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="flex min-h-screen bg-surface-100">
      {isHR ? <HRSideNavber /> : <SideNavbar />}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap animate-fade-in-down">
            <Heading
              heading="Meetings"
              subtitle="Create, join and manage all your meetings in one place."
            />
            <div className="relative" ref={menuRef}>
              <Button
                label="New Meeting"
                onClick={() => setMenuOpen((m) => !m)}
                className="shadow-md shadow-brand-600/25"
              />
              {menuOpen && (
                <div className="absolute right-0 top-12 z-30 w-56 overflow-hidden rounded-2xl border border-ink-200/70 bg-white py-1.5 shadow-xl animate-fade-in-up">
                  {[
                    { label: "Instant meeting", icon: "⚡", type: "instant" },
                    {
                      label: "Schedule a meeting",
                      icon: "📅",
                      type: "scheduled",
                    },
                    {
                      label: "Personal room",
                      icon: "🔗",
                      type: "personal-room",
                    },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setMenuOpen(false);
                        setCreateType(item.type);
                        setCreateModal(true);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {dashboardLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-surface p-4">
                  <div className="skeleton h-8 w-8 rounded-xl mb-3" />
                  <div className="skeleton h-6 w-12 mb-1" />
                  <div className="skeleton h-3 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 animate-fade-in">
              {STAT_CARDS.map((card) => (
                <Card key={card.key} className="!p-4 card-hover">
                  <div
                    className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${card.tone} text-white shadow-md`}
                  >
                    <card.icon className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold text-ink-950 tabular-nums">
                    {analytics?.[card.key] ?? "—"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">{card.label}</p>
                </Card>
              ))}
            </div>
          )}

          {personalRoom && (
            <Card className="!p-0 overflow-hidden animate-fade-in-up">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-600 to-brand-500 p-5 text-white">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
                    <Link className="h-6 w-6" strokeWidth={1.8} />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold">
                      {personalRoom.title}
                    </h3>
                    <p className="text-sm text-white/80">
                      Your permanent room · {personalRoom.meetingId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(personalRoom)}
                    className="rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/25"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => handleStart(personalRoom)}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-md transition-all hover:bg-brand-50"
                  >
                    Open Room
                  </button>
                </div>
              </div>
            </Card>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setTab(t.key);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all duration-200 ${
                    tab === t.key
                      ? "bg-brand-600 text-white shadow-sm shadow-brand-600/25"
                      : "text-ink-500 hover:bg-ink-100/70 hover:text-ink-800"
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <InputBox
                id="meetingSearch"
                name="search"
                placeholder="Search meetings..."
                setInput={setSearch}
                getInput={search}
                className="w-full sm:!w-52"
              />
              <SelectBox
                id="meetingStatus"
                name="status"
                getInput={status}
                setInput={setStatus}
                option={statusOptions}
                placeholder="All statuses"
                className="flex-1 sm:w-48 sm:flex-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card-surface p-5">
                  <div className="flex items-center gap-3">
                    <div className="skeleton h-11 w-11 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-1/3" />
                      <div className="skeleton h-3 w-2/3" />
                    </div>
                    <div className="skeleton h-8 w-24 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <Card className="animate-fade-in-up">
              <EmptyState
                icon={
                  <Video className="h-7 w-7" strokeWidth={1.8} />
                }
                title="No meetings found"
                description="Create a new meeting or adjust your filters to see more."
                action={
                  <Button
                    label="New Meeting"
                    onClick={() => setCreateModal(true)}
                  />
                }
              />
            </Card>
          ) : (
            <div className="space-y-4 animate-fade-in-up">
              {meetings.map((meeting) => (
                <MeetingCard
                  key={meeting._id}
                  meeting={meeting}
                  canManage={canManage(meeting)}
                  onJoin={handleJoin}
                  onOpen={handleOpen}
                  onStart={handleStart}
                  onEnd={handleEnd}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                  onCopyLink={handleCopyLink}
                  onInvite={handleInvite}
                />
              ))}
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  label="Previous"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                />
                <span className="px-2 text-xs text-ink-500">Page {page}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  label="Next"
                  disabled={page * 12 >= total}
                  onClick={() => setPage((p) => p + 1)}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <MeetingCreateModal
        open={createModal}
        onClose={() => setCreateModal(false)}
        defaultType={createType}
        employees={employees}
        candidates={candidates}
        onCreated={handleCreate}
      />
      <GuestInviteModal
        open={inviteModal}
        onClose={() => {
          setInviteModal(false);
          setInviteMeeting(null);
        }}
        meetingId={inviteMeeting?._id}
        candidates={candidates}
      />
    </div>
  );
};

export default Meeting;
