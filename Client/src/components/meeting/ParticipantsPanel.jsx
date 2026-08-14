import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { loadParticipants, admitExistingParticipant, kickParticipant } from "../../redux/slices/meetingSlice";
import { formatTime } from "../../utils/dateUtils";
import { Users } from "lucide-react";

const ROLE_TONES = {
  host: "bg-brand-50 text-brand-700 ring-brand-500/20",
  presenter: "bg-purple-50 text-purple-700 ring-purple-500/20",
  interviewer: "bg-indigo-50 text-indigo-700 ring-indigo-500/20",
  participant: "bg-ink-100 text-ink-600 ring-ink-400/20",
  guest: "bg-amber-50 text-amber-700 ring-amber-500/20",
  candidate: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
};

const STATUS_DOT = {
  waiting: "bg-amber-400",
  joined: "bg-emerald-500",
  admitted: "bg-emerald-500",
  left: "bg-ink-300",
};

const ParticipantsPanel = ({ meetingId, isHost = false, socket }) => {
  const dispatch = useDispatch();
  const participants = useSelector((state) => state.meeting.participants);
  const participantsLoading = useSelector((state) => state.meeting.participantsLoading);

  useEffect(() => {
    if (meetingId) dispatch(loadParticipants(meetingId));
  }, [meetingId, dispatch]);

  useEffect(() => {
    if (!socket) return;
    const onPresence = () => {
      dispatch(loadParticipants(meetingId));
    };
    socket.on("meeting:presence", onPresence);
    return () => socket.off("meeting:presence", onPresence);
  }, [socket, meetingId, dispatch]);

  const handleAdmit = async (id) => {
    try {
      await dispatch(admitExistingParticipant(meetingId, id));
      toast.success("Participant admitted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to admit");
    }
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Remove ${name} from the meeting?`)) return;
    try {
      await dispatch(kickParticipant(meetingId, id));
      toast.success("Participant removed");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove participant");
    }
  };

  const waiting = participants.filter((p) => p.status === "waiting");
  const inMeeting = participants.filter((p) => p.status !== "waiting");
  const left = participants.filter((p) => p.status === "left");

  const ParticipantRow = ({ p, showRemove }) => (
    <div className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-ink-50/60">
      <div className="relative">
        {p.employee?.profileImg ? (
          <img
            src={p.employee.profileImg}
            alt=""
            className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-ink-300 to-ink-400 text-sm font-semibold text-white ring-2 ring-white">
            {(p.displayName || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
            STATUS_DOT[p.status] || "bg-ink-300"
          }`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-800">
          {p.displayName || p.employee?.name || p.candidate?.firstName || "Guest"}
          {p.employee && String(p.employee._id) === String(p.meetingHost?.id) ? " (You)" : ""}
        </p>
        <p className="text-[11px] text-ink-400">
          {p.participantType}
          {p.joinedAt ? ` · joined ${formatTime(p.joinedAt)}` : ""}
        </p>
      </div>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${ROLE_TONES[p.role] || ROLE_TONES.participant}`}>
        {p.role}
      </span>
      {isHost && (p.status === "waiting" || p.role === "guest" || p.participantType === "guest") && (
        <div className="flex gap-1">
          {p.status === "waiting" && (
            <button
              onClick={() => handleAdmit(p._id)}
              className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20"
              title="Admit to meeting">
              Admit
            </button>
          )}
          {showRemove && (
            <button
              onClick={() => handleRemove(p._id, p.displayName || "guest")}
              className="rounded-lg bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-500/20"
              title="Remove participant">
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (participantsLoading && participants.length === 0) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3.5 w-1/3" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink-200/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-500" />
          <h3 className="text-sm font-semibold text-ink-900">
            Participants{" "}
            <span className="ml-1 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
              {inMeeting.length + waiting.length}
            </span>
          </h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {waiting.length > 0 && (
          <div className="py-2">
            <p className="px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Waiting Room ({waiting.length})
            </p>
            {waiting.map((p) => (
              <ParticipantRow key={p._id} p={p} showRemove />
            ))}
          </div>
        )}
        <div className="py-2">
          <p className="px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">
            In Meeting ({inMeeting.length})
          </p>
          {inMeeting.length === 0 && (
            <p className="px-4 py-2 text-xs text-ink-400">No active participants</p>
          )}
          {inMeeting.map((p) => (
            <ParticipantRow key={p._id} p={p} showRemove={isHost} />
          ))}
        </div>
        {left.length > 0 && (
          <div className="py-2">
            <p className="px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">
              Left ({left.length})
            </p>
            {left.map((p) => (
              <ParticipantRow key={p._id} p={p} showRemove={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantsPanel;
