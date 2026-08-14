import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import { getToken, SOCKET_URL } from "../utils/api";
import {
  loadActiveMeeting,
  joinExistingMeeting,
  endExistingMeeting,
  upsertMeeting,
} from "../redux/slices/meetingSlice";
import MeetingChatPanel from "../components/meeting/MeetingChatPanel";
import ParticipantsPanel from "../components/meeting/ParticipantsPanel";
import Whiteboard from "../components/meeting/Whiteboard";
import useMeetingRTC from "../hooks/useMeetingRTC";
import { formatDateTime } from "../utils/dateUtils";
import {
  Monitor,
  VolumeX,
  Check,
  Clock,
  Mic,
  Video,
  Disc,
  Hand,
  MessageSquare,
  Users,
  PenTool,
} from "lucide-react";

const VideoTile = ({
  label,
  sub,
  initials,
  muted,
  isSelf,
  raised,
  active,
  stream,
  videoVisible,
  screenSharing,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || el.srcObject === stream) return;
    el.srcObject = stream;
    el.play().catch(() => {});
  }, [stream]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || isSelf) return;
    const tryPlay = () => el.play().catch(() => {});
    window.addEventListener("click", tryPlay);
    window.addEventListener("pointerdown", tryPlay);
    return () => {
      window.removeEventListener("click", tryPlay);
      window.removeEventListener("pointerdown", tryPlay);
    };
  }, [isSelf]);

  return (
    <div
      className={`relative aspect-video overflow-hidden rounded-2xl border bg-gradient-to-br from-ink-800 to-ink-950 transition-all duration-300 ${
        active ? "border-brand-400 ring-2 ring-brand-400/30" : "border-ink-700/60"
      }`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isSelf}
        className={`absolute inset-0 h-full w-full object-cover ${videoVisible ? "opacity-100" : "opacity-0"}`}
      />
      {!videoVisible && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-300">
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white ${
              isSelf
                ? "bg-gradient-to-br from-brand-500 to-brand-700"
                : "bg-gradient-to-br from-ink-500 to-ink-600"
            }`}>
            {initials}
          </span>
          <span className="text-sm font-medium text-ink-200">
            {label} {isSelf ? "(You)" : ""}
          </span>
          {sub && <span className="text-[11px] text-ink-400">{sub}</span>}
        </div>
      )}
      {videoVisible && (
        <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center px-2">
          <span className="rounded-full bg-ink-950/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
            {label} {isSelf ? "(You)" : ""}
            {sub ? ` · ${sub}` : ""}
          </span>
        </div>
      )}
      {screenSharing && (
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-brand-600/90 px-2 py-1 text-[10px] font-semibold text-white shadow-lg">
          <Monitor className="h-3 w-3" />
          Screen
        </span>
      )}
      {raised && (
          <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-lg shadow-lg animate-bounce">
            <Hand className="h-5 w-5" />
          </span>
      )}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        {muted && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-950/70 text-ink-100" title="Muted">
            <VolumeX className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  );
};

const ToolbarButton = ({ active, onClick, label, danger, children }) => (
  <button
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ${
      active
        ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
        : danger
          ? "bg-ink-800 text-ink-200 hover:bg-red-600 hover:text-white"
          : "bg-ink-800 text-ink-200 hover:bg-ink-700"
    }`}>
    {children}
  </button>
);

const getGuestToken = () => {
  try {
    return sessionStorage.getItem("meetingGuestToken") || "";
  } catch {
    return "";
  }
};

const getGuestInfo = () => {
  try {
    const raw = sessionStorage.getItem("meetingGuestInfo");
    if (raw) return JSON.parse(raw);
    return {
      name: sessionStorage.getItem("meetingGuestName") || "",
      email: sessionStorage.getItem("meetingGuestEmail") || "",
      title: sessionStorage.getItem("meetingGuestTitle") || "",
    };
  } catch {
    return null;
  }
};

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const userId = user?.user?.id;
  const userName = user?.user?.name;
  const isGuest = !user?.token;
  const guestInfo = isGuest ? getGuestInfo() : null;

  const meeting = useSelector((state) => state.meeting.activeMeeting);

  const [socketInstance, setSocketInstance] = useState(null);
  const [presence, setPresence] = useState([]);
  const [panel, setPanel] = useState(null);
  const [connected, setConnected] = useState(false);
  const [joining, setJoining] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [rtcRaised, setRtcRaised] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const joiningRef = useRef(true);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    joiningRef.current = joining;
  }, [joining]);

  const loadMeeting = useCallback(async () => {
    try {
      const data = await dispatch(loadActiveMeeting(meetingId));
      if (!data) {
        toast.error("Meeting not found");
        navigate("/meeting");
        return;
      }
      const joined = await dispatch(joinExistingMeeting(meetingId));
      if (joined?.participant?.role) setIsHost(joined.participant.role === "host");
      setIsHost((h) => h || String(data.organizer?._id || data.organizer) === String(userId));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to join meeting");
      navigate("/meeting");
    } finally {
      setJoining(false);
    }
  }, [dispatch, meetingId, navigate, userId]);

  useEffect(() => {
    if (isGuest) {
      setJoining(false);
      return;
    }
    loadMeeting();
  }, [loadMeeting, isGuest]);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    setSocketInstance(socket);
    socket.on("connect", () => {
      socket.emit("authenticate", { token: getToken() });
      if (userId) socket.emit("register", String(userId));
      setConnected(true);
      if (isGuest) {
        socket.emit("meeting:join", { meetingId, token: getGuestToken() });
      } else if (!joiningRef.current) {
        socket.emit("meeting:join", { meetingId, token: "" });
      }
    });
    socket.on("meeting:presence", (present) => {
      setPresence(present || []);
    });
    socket.on("meeting:raise-hand", ({ userId: uid, name, raised: r }) => {
      setPresence((prev) =>
        prev.map((p) => (p.userId === uid || p.name === name ? { ...p, raised: r } : p))
      );
    });
    socket.on("meeting:error", ({ message }) => toast.error(message || "Meeting error"));
    socket.on("meeting:ended", () => {
      toast.info("Meeting has ended");
      navigate("/meeting");
    });
    socket.on("meeting:cancelled", () => {
      toast.info("Meeting was cancelled");
      navigate("/meeting");
    });

    return () => {
      socket.emit("meeting:leave", { meetingId });
      socket.disconnect();
      setSocketInstance(null);
    };
  }, [meetingId, userId, isGuest, navigate]);

  useEffect(() => {
    if (isGuest || !socketInstance || joining) return;
    socketInstance.emit("meeting:join", { meetingId, token: "" });
  }, [socketInstance, joining, isGuest, meetingId]);

  const rtc = useMeetingRTC({
    socket: socketInstance,
    meetingId,
    meetingDbId: meeting?._id,
    active: !joining,
  });

  useEffect(() => {
    if (rtc.removed) {
      toast.error("You were removed from the meeting by the host.");
      navigate("/meeting");
    }
  }, [rtc.removed, navigate]);

  const handleLeave = () => {
    socketInstance?.emit("meeting:leave", { meetingId });
    navigate("/meeting");
  };

  const handleEnd = async () => {
    if (!isHost) return handleLeave();
    if (!window.confirm("End the meeting for everyone?")) return;
    try {
      const ended = await dispatch(endExistingMeeting(meeting._id));
      dispatch(upsertMeeting(ended));
      socketInstance?.emit("meeting:leave", { meetingId });
      navigate("/meeting");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to end meeting");
    }
  };

  const toggleRaise = () => {
    const next = !rtcRaised;
    setRtcRaised(next);
    socketInstance?.emit("meeting:raise-hand", { meetingId, raised: next });
  };

  const handleMuteAll = () => {
    if (!isHost) return;
    socketInstance?.emit("meeting:mute-all", { meetingId });
    toast.info("All participants have been muted");
  };

  const formatElapsed = () => {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const initials = (name) => (name || "?").charAt(0).toUpperCase();
  const selfName = isGuest ? guestInfo?.name || "Guest" : userName || "You";

  const selfTile = {
    key: "self",
    label: selfName,
    initials: initials(selfName),
    isSelf: true,
    muted: !rtc.micOn,
    active: rtc.micOn,
    stream: rtc.localStream,
    videoVisible: Boolean(rtc.localStream?.getVideoTracks().length) && rtc.camOn,
    screenSharing: rtc.screenSharing,
  };

  const remoteTiles = rtc.remoteStreams.map(({ socketId, stream }) => {
    const st = rtc.peerStates.find((p) => p.socketId === socketId) || {};
    const hasVideo = Boolean(stream?.getVideoTracks().length);
    return {
      key: socketId,
      label: st.name || "Participant",
      sub: st.isHost ? "Host" : "Participant",
      initials: initials(st.name),
      muted: !st.micOn,
      raised: presence.find((p) => p.socketId === socketId)?.raised,
      stream,
      videoVisible: hasVideo && (st.camOn || st.screenSharing),
      screenSharing: st.screenSharing,
    };
  });

  const tiles = [selfTile, ...remoteTiles];

  if (joining) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-3xl font-bold text-white shadow-glow">
              {initials(selfName)}
            </span>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-ink-950">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </span>
          </div>
          <p className="text-lg font-semibold text-white">Joining meeting…</p>
          <p className="text-sm text-ink-400">{meetingId}</p>
          <div className="h-1 w-40 overflow-hidden rounded-full bg-ink-800">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
          </div>
        </div>
      </div>
    );
  }

  if (rtc.waiting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-950 p-6 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-4xl shadow-glow-sm">
          <Clock className="h-9 w-9 text-white" strokeWidth={1.8} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-white">Waiting Room</h1>
          <p className="mt-1 text-sm text-ink-400">{meeting?.title || guestInfo?.title || "Meeting"}</p>
          <p className="mt-2 text-sm text-ink-300">The host has not admitted you yet.</p>
        </div>
        <button
          onClick={handleLeave}
          className="rounded-xl bg-ink-800 px-5 py-2.5 text-sm font-semibold text-ink-200 transition-colors hover:bg-ink-700">
          Leave waiting room
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-ink-950">
      <header className="flex items-center justify-between gap-4 border-b border-ink-800 px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-white">
            {meeting?.title || guestInfo?.title || "Meeting"}
          </h1>
          <p className="truncate text-[11px] text-ink-400">
            {meeting ? formatDateTime(meeting.start) : ""} · {meetingId}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-ink-800/80 px-3 py-1.5">
            <span
              className={`h-2 w-2 animate-pulse rounded-full ${
                connected ? "bg-emerald-500" : "bg-amber-400"
              }`}
            />
            <span className="font-mono text-xs text-ink-200 tabular-nums">{formatElapsed()}</span>
          </div>
          {rtc.recording && (
            <div className="flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1.5">
              <span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
              <span className="text-xs font-semibold text-red-400">REC</span>
            </div>
          )}
          <span className="rounded-full bg-ink-800/80 px-3 py-1.5 text-xs text-ink-300">
            {presence.length + 1} in room
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1 p-4">
          <div className="grid h-full grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 scrollbar-thin">
            {tiles.map((t) => (
              <VideoTile key={t.key} {...t} />
            ))}
            {tiles.length === 1 && (
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-ink-700 text-ink-500">
                <p className="text-sm">Waiting for others to join…</p>
              </div>
            )}
          </div>
          {rtc.mediaError && (
            <div className="absolute bottom-4 left-1/2 flex max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-950/90 px-4 py-2.5 text-xs text-amber-200 shadow-lg">
              <span>{rtc.mediaError}</span>
              <button
                onClick={rtc.retryMedia}
                className="rounded-lg bg-brand-500/20 px-2 py-1 font-semibold text-brand-100 hover:bg-brand-500/30">
                Try Again
              </button>
              <button
                onClick={rtc.dismissError}
                className="rounded-lg bg-amber-500/20 px-2 py-1 font-semibold text-amber-100 hover:bg-amber-500/30">
                Dismiss
              </button>
            </div>
          )}
          {import.meta.env.DEV && (
            <div className="absolute bottom-4 right-4 z-10 w-72 rounded-xl border border-ink-700 bg-ink-900/95 p-3 text-[11px] text-ink-300 shadow-xl">
              <details>
                <summary className="cursor-pointer select-none font-semibold text-ink-200">
                  WebRTC Debug
                </summary>
                <div className="mt-2 space-y-1 font-mono">
                  <p>
                    socket {rtc.debug.socketId || "-"} ·{" "}
                    {rtc.debug.socketConnected ? "connected" : "disconnected"}
                  </p>
                  <p>
                    local mic {rtc.debug.localMedia.micOn ? "on" : "off"} · cam{" "}
                    {rtc.debug.localMedia.camOn ? "on" : "off"} · tracks a{rtc.debug.localMedia.audio ? "y" : "n"} v
                    {rtc.debug.localMedia.video ? "y" : "n"}
                  </p>
                  <p>participants {rtc.debug.participants.length + 1}</p>
                  {rtc.debug.peers.length === 0 && <p className="text-ink-500">no peers yet</p>}
                  {rtc.debug.peers.map((p) => (
                    <div key={p.socketId} className="rounded-md bg-ink-800/70 p-2">
                      <p className="text-ink-200">{p.socketId.slice(0, 12)}</p>
                      <p>
                        conn {p.connectionState} · ice {p.iceState}
                      </p>
                      <p>signal {p.signalingState}</p>
                      <p>
                        remote audio {p.remoteAudio ? "y" : "n"} · video {p.remoteVideo ? "y" : "n"}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </main>

        {panel && (
          <div
            className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm sm:hidden"
            onClick={() => setPanel(null)}
            aria-hidden="true"
          />
        )}

        {panel && (
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-ink-800 bg-ink-900/95 backdrop-blur animate-fade-in-left sm:static sm:z-auto sm:w-80 sm:bg-ink-900/60">
            {panel === "chat" && (
              <MeetingChatPanel meetingId={meetingId} socket={socketInstance} />
            )}
            {panel === "participants" && (
              <ParticipantsPanel
                meetingId={meeting?._id}
                isHost={isHost}
                socket={socketInstance}
                presence={presence}
                onKickBySocket={(targetSocketId) =>
                  socketInstance?.emit("meeting:remove", { meetingId, targetSocketId })
                }
              />
            )}
            {panel === "whiteboard" && <Whiteboard socket={socketInstance} meetingId={meetingId} />}
          </aside>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-3 border-t border-ink-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <ToolbarButton active={rtc.micOn} label={rtc.micOn ? "Mute" : "Unmute"} onClick={rtc.toggleMic}>
            <Mic className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton active={rtc.camOn} label={rtc.camOn ? "Camera off" : "Camera on"} onClick={rtc.toggleCam}>
            <Video className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton active={rtc.screenSharing} label="Share screen" onClick={rtc.toggleScreenShare}>
            <Monitor className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton active={rtc.recording} label={rtc.recording ? "Stop recording" : "Record"} onClick={rtc.toggleRecording}>
            <Disc className="h-5 w-5" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-3">
          <ToolbarButton active={rtcRaised} label="Raise hand" onClick={toggleRaise}>
            <Hand className="h-5 w-5" />
          </ToolbarButton>
          {isHost && (
            <ToolbarButton active={false} label="Mute all" onClick={handleMuteAll}>
              <VolumeX className="h-5 w-5" />
            </ToolbarButton>
          )}
          <ToolbarButton active={panel === "chat"} label="Chat" onClick={() => setPanel(panel === "chat" ? null : "chat")}>
            <MessageSquare className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton active={panel === "participants"} label="Participants" onClick={() => setPanel(panel === "participants" ? null : "participants")}>
            <Users className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton active={panel === "whiteboard"} label="Whiteboard" onClick={() => setPanel(panel === "whiteboard" ? null : "whiteboard")}>
            <PenTool className="h-5 w-5" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="rounded-xl bg-ink-800 px-4 py-2.5 text-sm font-semibold text-ink-200 transition-colors hover:bg-ink-700">
            Leave
          </button>
          <button
            onClick={handleEnd}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
              isHost ? "bg-red-600 hover:bg-red-500" : "bg-ink-800 text-ink-200 hover:bg-ink-700"
            }`}>
            {isHost ? "End Meeting" : "Leave"}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default MeetingRoom;
