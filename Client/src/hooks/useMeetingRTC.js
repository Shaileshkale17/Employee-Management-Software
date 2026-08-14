import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../utils/api";

const RTC_CONFIG = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
      ],
    },
  ],
};

const TURN_URL = import.meta.env.VITE_TURN_URL;
if (TURN_URL) {
  RTC_CONFIG.iceServers.push({
    urls: TURN_URL.split(","),
    username: import.meta.env.VITE_TURN_USERNAME || "",
    credential: import.meta.env.VITE_TURN_CREDENTIAL || "",
  });
}

const pickMimeType = () => {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "audio/webm",
  ];
  for (const mime of candidates) {
    try {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    } catch {
      // keep looking
    }
  }
  return "";
};

const getGuestToken = () => {
  try {
    return sessionStorage.getItem("meetingGuestToken") || "";
  } catch {
    return "";
  }
};

const describeMediaError = (err, stage = "") => {
  const name = err?.name || "";
  const suffix = stage ? ` while enabling ${stage}` : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Microphone / camera permission was denied. Click Try Again to re-request access.";
    case "SecurityError":
      return "Microphone / camera access is blocked by this page or browser.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return `No ${stage || "camera / microphone"} device was found.`;
    case "NotReadableError":
    case "TrackStartError":
      return "A microphone or camera is already in use by another application. Close it and try again.";
    case "OverconstrainedError":
      return "The camera / microphone could not satisfy the requested settings.";
    case "AbortError":
      return "Microphone / camera access was aborted. Try again.";
    case "TypeError":
      return "Microphone / camera access is not supported in this browser.";
    default:
      return `Unable to access microphone / camera${suffix}${name ? ` (${name})` : ""}.`;
  }
};

export const useMeetingRTC = ({ socket, meetingId, meetingDbId, active = false }) => {
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [mySocketId, setMySocketId] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [, setVersion] = useState(0);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const audioStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const peerStatesRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const mySocketIdRef = useRef(null);
  const myStateRef = useRef({ micOn: false, camOn: false, screenSharing: false });
  const recorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingStartRef = useRef(null);
  const mediaStartedRef = useRef(false);

  const getOutgoingVideoTrack = useCallback(
    () =>
      screenStreamRef.current?.getVideoTracks()[0] ||
      cameraStreamRef.current?.getVideoTracks()[0] ||
      null,
    []
  );

  const getOutgoingAudioTrack = useCallback(
    () => audioStreamRef.current?.getAudioTracks()[0] || null,
    []
  );

  const updateLocalPreview = useCallback(() => {
    const videoTrack = getOutgoingVideoTrack();
    const audioTrack = getOutgoingAudioTrack();
    let stream = localStreamRef.current;
    if (!stream) {
      stream = new MediaStream();
      localStreamRef.current = stream;
    }
    stream.getVideoTracks().forEach((t) => stream.removeTrack(t));
    stream.getAudioTracks().forEach((t) => stream.removeTrack(t));
    if (videoTrack) stream.addTrack(videoTrack);
    if (audioTrack) stream.addTrack(audioTrack);
    setLocalStream(stream);
    bump();
  }, [getOutgoingVideoTrack, getOutgoingAudioTrack, bump]);

  const startMedia = useCallback(async () => {
    if (mediaStartedRef.current || typeof navigator === "undefined" || !navigator.mediaDevices) {
      return;
    }
    mediaStartedRef.current = true;
    const log = (...args) => {
      if (import.meta.env.DEV) console.log("[Meeting RTC] startMedia:", ...args);
    };
    try {
      log("requesting full media");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      if (audioTracks.length) audioStreamRef.current = new MediaStream([audioTracks[0]]);
      if (videoTracks.length) cameraStreamRef.current = new MediaStream([videoTracks[0]]);
      myStateRef.current = {
        micOn: audioTracks.length > 0,
        camOn: videoTracks.length > 0,
        screenSharing: false,
      };
      setMicOn(audioTracks.length > 0);
      setCamOn(videoTracks.length > 0);
      updateLocalPreview();
      log("full media ready", { audio: audioTracks.length, video: videoTracks.length });
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[Meeting RTC] full media failed:", err);
      try {
        log("falling back to audio-only");
        const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = new MediaStream(audioOnly.getAudioTracks());
        myStateRef.current = { micOn: true, camOn: false, screenSharing: false };
        setMicOn(true);
        setCamOn(false);
        updateLocalPreview();
        if (err?.name !== "NotFoundError" && err?.name !== "DevicesNotFoundError") {
          setMediaError(describeMediaError(err, "camera"));
        }
      } catch (err2) {
        if (import.meta.env.DEV) console.warn("[Meeting RTC] audio-only failed:", err2);
        try {
          log("falling back to video-only");
          const videoOnly = await navigator.mediaDevices.getUserMedia({ video: true });
          cameraStreamRef.current = new MediaStream(videoOnly.getVideoTracks());
          myStateRef.current = { micOn: false, camOn: true, screenSharing: false };
          setMicOn(false);
          setCamOn(true);
          updateLocalPreview();
          setMediaError(describeMediaError(err2, "microphone"));
        } catch (err3) {
          if (import.meta.env.DEV) console.warn("[Meeting RTC] video-only failed:", err3);
          myStateRef.current = { micOn: false, camOn: false, screenSharing: false };
          setMicOn(false);
          setCamOn(false);
          const firstNamed = [err, err2, err3].find((e) => e?.name);
          setMediaError(describeMediaError(firstNamed || err3, ""));
        }
      }
    }
  }, [updateLocalPreview]);

  const broadcastState = useCallback(() => {
    socket?.emit("meeting:media-state", { meetingId, state: myStateRef.current });
  }, [socket, meetingId]);

  const syncTracksToPeers = useCallback(() => {
    peersRef.current.forEach(({ pc }) => {
      const audio = getOutgoingAudioTrack();
      const video = getOutgoingVideoTrack();
      if (audio && !pc.getSenders().some((s) => s.track?.kind === "audio")) {
        pc.addTrack(audio, localStreamRef.current || (localStreamRef.current = new MediaStream()));
      }
      if (video && !pc.getSenders().some((s) => s.track?.kind === "video")) {
        pc.addTrack(video, localStreamRef.current || (localStreamRef.current = new MediaStream()));
      }
    });
  }, [getOutgoingAudioTrack, getOutgoingVideoTrack]);

  const retryMedia = useCallback(async () => {
    if (mediaStartedRef.current) {
      mediaStartedRef.current = false;
      const tracks = [
        ...(audioStreamRef.current?.getTracks() || []),
        ...(cameraStreamRef.current?.getTracks() || []),
      ];
      tracks.forEach((t) => t.stop());
      audioStreamRef.current = null;
      cameraStreamRef.current = null;
      myStateRef.current = { ...myStateRef.current, micOn: false, camOn: false };
      setMicOn(false);
      setCamOn(false);
      updateLocalPreview();
    }
    setMediaError(null);
    await startMedia();
    syncTracksToPeers();
    broadcastState();
  }, [startMedia, syncTracksToPeers, broadcastState, updateLocalPreview]);

  const sendSignal = useCallback(
    (to, data) => {
      socket?.emit("meeting:signal", { meetingId, to, data });
    },
    [socket, meetingId]
  );

  const flushCandidates = useCallback((socketId) => {
    const list = pendingCandidatesRef.current.get(socketId) || [];
    pendingCandidatesRef.current.set(socketId, []);
    const pc = peersRef.current.get(socketId)?.pc;
    if (!pc) return;
    list.forEach(async (candidate) => {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        // ignore stale candidates
      }
    });
  }, []);

  const closePeer = useCallback(
    (socketId) => {
      const entry = peersRef.current.get(socketId);
      if (!entry) return;
      entry.pc.onnegotiationneeded = null;
      entry.pc.onicecandidate = null;
      entry.pc.ontrack = null;
      entry.pc.onconnectionstatechange = null;
      entry.pc.oniceconnectionstatechange = null;
      entry.pc.onsignalingstatechange = null;
      try {
        entry.pc.close();
      } catch {
        // already closed
      }
      peersRef.current.delete(socketId);
      peerStatesRef.current.delete(socketId);
      pendingCandidatesRef.current.delete(socketId);
      bump();
    },
    [bump]
  );

  const closeAllPeers = useCallback(() => {
    Array.from(peersRef.current.keys()).forEach((id) => closePeer(id));
  }, [closePeer]);

  const addLocalTracks = useCallback(
    (pc) => {
      const audio = getOutgoingAudioTrack();
      const video = getOutgoingVideoTrack();
      if (audio && !pc.getSenders().some((s) => s.track?.kind === "audio")) {
        pc.addTrack(audio, localStreamRef.current || (localStreamRef.current = new MediaStream()));
      }
      if (video && !pc.getSenders().some((s) => s.track?.kind === "video")) {
        pc.addTrack(video, localStreamRef.current || (localStreamRef.current = new MediaStream()));
      }
    },
    [getOutgoingAudioTrack, getOutgoingVideoTrack]
  );

  const createPeer = useCallback(
    (socketId) => {
      if (peersRef.current.has(socketId)) return peersRef.current.get(socketId).pc;
      const pc = new RTCPeerConnection(RTC_CONFIG);
      const remoteStream = new MediaStream();
      peersRef.current.set(socketId, { pc, stream: remoteStream, makingOffer: false });
      peerStatesRef.current.set(socketId, {
        name: "",
        isHost: false,
        micOn: true,
        camOn: true,
        screenSharing: false,
        hasStream: false,
        hasVideo: false,
        hasAudio: false,
        connectionState: "new",
        iceState: "new",
        signalingState: "stable",
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignal(socketId, { type: "ice", candidate: e.candidate.toJSON() });
        }
      };

      pc.ontrack = (e) => {
        e.streams.forEach((s) => {
          s.getTracks().forEach((t) => {
            if (!remoteStream.getTracks().some((x) => x.id === t.id)) {
              remoteStream.addTrack(t);
            }
          });
        });
        if (e.track && !remoteStream.getTracks().some((x) => x.id === e.track.id)) {
          remoteStream.addTrack(e.track);
        }
        const peerState = peerStatesRef.current.get(socketId);
        if (peerState) {
          peerStatesRef.current.set(socketId, {
            ...peerState,
            hasStream: remoteStream.getTracks().length > 0,
            hasAudio: remoteStream.getAudioTracks().length > 0,
            hasVideo: remoteStream.getVideoTracks().length > 0,
          });
        }
        if (import.meta.env.DEV) {
          console.log(
            `[Meeting RTC] received tracks from ${socketId}:`,
            e.streams.map((s) => s.getTracks().map((t) => t.kind)).flat(),
            e.track?.kind
          );
        }
        bump();
      };

      pc.onconnectionstatechange = () => {
        const peerState = peerStatesRef.current.get(socketId);
        if (peerState) {
          peerStatesRef.current.set(socketId, {
            ...peerState,
            connectionState: pc.connectionState,
          });
        }
        if (import.meta.env.DEV) {
          console.log(`[Meeting RTC] peer ${socketId} connection:`, pc.connectionState);
        }
        if (pc.connectionState === "failed") {
          setTimeout(() => {
            const current = peersRef.current.get(socketId)?.pc;
            if (current === pc && pc.connectionState === "failed") {
              try {
                pc.restartIce();
              } catch {
                // restart not available
              }
            }
          }, 1200);
        }
        if (pc.connectionState === "disconnected") {
          setTimeout(() => {
            const current = peersRef.current.get(socketId)?.pc;
            if (current === pc && pc.connectionState === "disconnected") {
              try {
                pc.restartIce();
              } catch {
                // restart not available
              }
            }
          }, 3000);
        }
        bump();
      };

      pc.oniceconnectionstatechange = () => {
        const peerState = peerStatesRef.current.get(socketId);
        if (peerState) {
          peerStatesRef.current.set(socketId, {
            ...peerState,
            iceState: pc.iceConnectionState,
          });
        }
        if (import.meta.env.DEV) {
          console.log(`[Meeting RTC] peer ${socketId} ICE:`, pc.iceConnectionState);
        }
        bump();
      };

      pc.onsignalingstatechange = () => {
        const peerState = peerStatesRef.current.get(socketId);
        if (peerState) {
          peerStatesRef.current.set(socketId, {
            ...peerState,
            signalingState: pc.signalingState,
          });
        }
        if (import.meta.env.DEV) {
          console.log(`[Meeting RTC] peer ${socketId} signaling:`, pc.signalingState);
        }
        bump();
      };

      pc.onnegotiationneeded = async () => {
        const entry = peersRef.current.get(socketId);
        if (!entry || entry.makingOffer) return;
        try {
          entry.makingOffer = true;
          await pc.setLocalDescription();
          sendSignal(socketId, { type: "offer", sdp: pc.localDescription });
          if (import.meta.env.DEV) {
            console.log(`[Meeting RTC] sent offer to ${socketId}`);
          }
        } catch (err) {
          console.error("Failed to create meeting offer:", err);
        } finally {
          if (peersRef.current.get(socketId) === entry) entry.makingOffer = false;
        }
      };

      addLocalTracks(pc);
      return pc;
    },
    [sendSignal, addLocalTracks, bump]
  );

  const handleSignal = useCallback(
    async ({ from, data }) => {
      if (!from || !data) return;
      const pc = createPeer(from);
      if (!pendingCandidatesRef.current.has(from)) {
        pendingCandidatesRef.current.set(from, []);
      }
      try {
        if (data.type === "offer") {
          const entry = peersRef.current.get(from);
          const isPolite = (mySocketIdRef.current || "") < from;
          const offerCollision = Boolean(entry?.makingOffer) || pc.signalingState !== "stable";
          if (offerCollision) {
            if (isPolite) {
              if (import.meta.env.DEV) {
                console.log(`[Meeting RTC] colliding offer from ${from}, rolling back (polite)`);
              }
              try {
                await pc.setLocalDescription({ type: "rollback" });
              } catch (rollbackErr) {
                if (import.meta.env.DEV) {
                  console.warn("[Meeting RTC] rollback failed:", rollbackErr);
                }
              }
            } else {
              if (import.meta.env.DEV) {
                console.log(`[Meeting RTC] ignoring colliding offer from ${from} (impolite)`);
              }
              return;
            }
          }
          await pc.setRemoteDescription({ type: "offer", sdp: data.sdp });
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal(from, { type: "answer", sdp: pc.localDescription });
          flushCandidates(from);
        } else if (data.type === "answer") {
          await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
          flushCandidates(from);
        } else if (data.type === "ice" && data.candidate) {
          if (pc.remoteDescription) {
            try {
              await pc.addIceCandidate(data.candidate);
            } catch {
              // stale candidate
            }
          } else {
            pendingCandidatesRef.current.get(from).push(data.candidate);
          }
        }
      } catch (err) {
        console.error("Meeting signal handling error:", err);
      }
    },
    [createPeer, sendSignal, flushCandidates]
  );

  const handlePresence = useCallback(
    (present = []) => {
      const current = new Set();
      present.forEach((p) => {
        if (!p.socketId || p.socketId === mySocketIdRef.current) return;
        current.add(p.socketId);
        const isNew = !peersRef.current.has(p.socketId);
        if (isNew) {
          createPeer(p.socketId);
        }
        const prev =
          peerStatesRef.current.get(p.socketId) || {
            name: "",
            isHost: false,
            micOn: true,
            camOn: true,
            screenSharing: false,
          };
        peerStatesRef.current.set(p.socketId, {
          ...prev,
          name: p.name || prev.name,
          isHost: Boolean(p.isHost),
        });
        if (isNew) {
          if (import.meta.env.DEV) {
            console.log(`[Meeting RTC] new participant seen: ${p.socketId}, broadcasting my state`);
          }
          broadcastState();
        }
      });
      Array.from(peersRef.current.keys()).forEach((id) => {
        if (!current.has(id)) closePeer(id);
      });
      bump();
    },
    [createPeer, closePeer, broadcastState, bump]
  );

  const handleMediaState = useCallback(
    ({ socketId, name, state }) => {
      if (!socketId) return;
      const prev =
        peerStatesRef.current.get(socketId) || {
          name: "",
          isHost: false,
          micOn: false,
          camOn: false,
          screenSharing: false,
        };
      peerStatesRef.current.set(socketId, {
        ...prev,
        name: name || prev.name,
        micOn: Boolean(state?.micOn),
        camOn: Boolean(state?.camOn),
        screenSharing: Boolean(state?.screenSharing),
      });
      bump();
    },
    [bump]
  );

  const handleForceMute = useCallback(() => {
    const track = audioStreamRef.current?.getAudioTracks()[0];
    if (track) track.enabled = false;
    myStateRef.current = { ...myStateRef.current, micOn: false };
    setMicOn(false);
    broadcastState();
    bump();
  }, [broadcastState, bump]);

  useEffect(() => {
    if (!socket) return;
    mySocketIdRef.current = socket.id;
    setMySocketId(socket.id);

    const onConnect = () => {
      mySocketIdRef.current = socket.id;
      setMySocketId(socket.id);
      closeAllPeers();
    };
    const onSignal = (payload) => handleSignal(payload);
    const onPresence = (payload) => handlePresence(payload);
    const onMediaState = (payload) => handleMediaState(payload);
    const onForceMute = () => handleForceMute();
    const onWaiting = ({ message } = {}) => {
      setWaiting(true);
      setMediaError(message || null);
    };
    const onAdmitted = () => {
      setWaiting(false);
      socket.emit("meeting:join", {
        meetingId,
        token: getGuestToken(),
      });
    };
    const onRemoved = () => setRemoved(true);
    const onRecord = (isRecording) => setRecording(Boolean(isRecording));

    socket.on("connect", onConnect);
    socket.on("meeting:signal", onSignal);
    socket.on("meeting:presence", onPresence);
    socket.on("meeting:media-state", onMediaState);
    socket.on("meeting:force-mute", onForceMute);
    socket.on("meeting:waiting", onWaiting);
    socket.on("meeting:admitted", onAdmitted);
    socket.on("meeting:removed", onRemoved);
    socket.on("meeting:record", onRecord);

    return () => {
      socket.off("connect", onConnect);
      socket.off("meeting:signal", onSignal);
      socket.off("meeting:presence", onPresence);
      socket.off("meeting:media-state", onMediaState);
      socket.off("meeting:force-mute", onForceMute);
      socket.off("meeting:waiting", onWaiting);
      socket.off("meeting:admitted", onAdmitted);
      socket.off("meeting:removed", onRemoved);
      socket.off("meeting:record", onRecord);
    };
  }, [
    socket,
    meetingId,
    handleSignal,
    handlePresence,
    handleMediaState,
    handleForceMute,
    closeAllPeers,
  ]);

  useEffect(() => {
    if (!active || !socket) return;
    startMedia().then(() => {
      syncTracksToPeers();
      broadcastState();
    });
  }, [active, socket, startMedia, syncTracksToPeers, broadcastState]);

  const uploadRecording = useCallback(
    async (blob, mimeType) => {
      if (!meetingDbId || !blob || blob.size === 0) return;
      try {
        const fd = new FormData();
        const ext = (mimeType || "").toLowerCase().includes("mp4") ? "mp4" : "webm";
        fd.append("file", blob, `meeting-recording-${Date.now()}.${ext}`);
        const durationSec = recordingStartRef.current
          ? Math.round((Date.now() - recordingStartRef.current) / 1000)
          : 0;
        fd.append("duration", String(durationSec));
        fd.append("status", "ready");
        await api.post(`/recording/${meetingDbId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (err) {
        console.error("Failed to upload meeting recording:", err);
      }
    },
    [meetingDbId]
  );

  const stopRecordingInternal = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;
    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType });
        recordedChunksRef.current = [];
        recordingStartRef.current = null;
        uploadRecording(blob, recorder.mimeType);
        resolve();
      };
      try {
        recorder.stop();
      } catch {
        resolve();
      }
    });
  }, [uploadRecording]);

  const toggleRecording = useCallback(async () => {
    if (recording) {
      await stopRecordingInternal();
      setRecording(false);
      socket?.emit("meeting:record", { meetingId, recording: false });
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setMediaError("Recording is not supported in this browser");
      return;
    }
    const mimeType = pickMimeType();
    let ctx = null;
    try {
      const mixed = new MediaStream();
      const AudioCtx = typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;
      if (AudioCtx) {
        ctx = new AudioCtx();
        const dest = ctx.createMediaStreamDestination();
        const audioTracks = [];
        const localAudio = getOutgoingAudioTrack();
        if (localAudio) audioTracks.push(localAudio);
        peersRef.current.forEach(({ stream }) => {
          stream.getAudioTracks().forEach((t) => audioTracks.push(t));
        });
        audioTracks
          .filter(Boolean)
          .forEach((t) => {
            const src = ctx.createMediaStreamSource(new MediaStream([t]));
            src.connect(dest);
          });
        dest.stream.getAudioTracks().forEach((t) => mixed.addTrack(t));
      }
      const videoTrack = getOutgoingVideoTrack();
      if (videoTrack) mixed.addTrack(videoTrack);
      if (mixed.getTracks().length === 0) {
        setMediaError("There is no media to record yet");
        return;
      }
      recordedChunksRef.current = [];
      recordingStartRef.current = Date.now();
      const recorder = new MediaRecorder(mixed, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      setRecording(true);
      socket?.emit("meeting:record", { meetingId, recording: true });
    } catch (err) {
      console.error("Failed to start recording:", err);
      setMediaError("Could not start recording");
      try {
        ctx?.close();
      } catch {
        // already closed
      }
    }
  }, [
    recording,
    getOutgoingAudioTrack,
    getOutgoingVideoTrack,
    meetingId,
    socket,
    stopRecordingInternal,
  ]);

  const toggleMic = useCallback(() => {
    const next = !myStateRef.current.micOn;
    myStateRef.current = { ...myStateRef.current, micOn: next };
    setMicOn(next);
    const track = audioStreamRef.current?.getAudioTracks()[0];
    if (track) track.enabled = next;
    broadcastState();
  }, [broadcastState]);

  const toggleCam = useCallback(async () => {
    const next = !myStateRef.current.camOn;
    myStateRef.current = { ...myStateRef.current, camOn: next };
    setCamOn(next);
    if (next) {
      if (!cameraStreamRef.current) {
        try {
          const video = await navigator.mediaDevices.getUserMedia({ video: true });
          cameraStreamRef.current = new MediaStream(video.getVideoTracks());
        } catch {
          myStateRef.current = { ...myStateRef.current, camOn: false };
          setCamOn(false);
          return;
        }
      }
      const t = cameraStreamRef.current.getVideoTracks()[0];
      if (t) t.enabled = true;
    } else {
      const t = cameraStreamRef.current?.getVideoTracks()[0];
      if (t) t.enabled = false;
    }
    updateLocalPreview();
    syncTracksToPeers();
    broadcastState();
  }, [updateLocalPreview, syncTracksToPeers, broadcastState]);

  const toggleScreenShare = useCallback(async () => {
    const isSharing = myStateRef.current.screenSharing;
    const restoreCamera = () => {
      const camTrack = cameraStreamRef.current?.getVideoTracks()[0] || null;
      peersRef.current.forEach(({ pc }) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(camTrack);
      });
    };
    if (isSharing) {
      const screenTracks = screenStreamRef.current?.getTracks() || [];
      screenStreamRef.current = null;
      restoreCamera();
      screenTracks.forEach((t) => t.stop());
      myStateRef.current = { ...myStateRef.current, screenSharing: false };
      setScreenSharing(false);
    } else {
      if (!navigator.mediaDevices.getDisplayMedia) {
        setMediaError("Screen sharing is not supported in this browser");
        return;
      }
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrack.onended = () => {
          if (!screenStreamRef.current) return;
          screenStreamRef.current = null;
          restoreCamera();
          myStateRef.current = { ...myStateRef.current, screenSharing: false };
          setScreenSharing(false);
          updateLocalPreview();
          broadcastState();
        };
        peersRef.current.forEach(({ pc }) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender && screenTrack) sender.replaceTrack(screenTrack);
        });
        myStateRef.current = { ...myStateRef.current, screenSharing: true };
        setScreenSharing(true);
      } catch {
        // user cancelled the picker
      }
    }
    updateLocalPreview();
    broadcastState();
  }, [updateLocalPreview, broadcastState]);

  useEffect(() => {
    return () => {
      closeAllPeers();
      if (recorderRef.current) {
        try {
          recorderRef.current.stop();
        } catch {
          // recorder already stopped
        }
      }
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
      cameraStreamRef.current = null;
      screenStreamRef.current = null;
      localStreamRef.current = null;
      mediaStartedRef.current = false;
    };
  }, [closeAllPeers]);

  const remoteStreams = Array.from(peersRef.current.entries()).map(
    ([socketId, { stream }]) => ({ socketId, stream })
  );
  const peerStates = Array.from(peerStatesRef.current.entries()).map(([socketId, s]) => ({
    socketId,
    ...s,
  }));

  const debug = {
    dev: Boolean(import.meta.env.DEV),
    socketId: mySocketId,
    socketConnected: Boolean(socket?.connected),
    meetingId,
    localMedia: {
      micOn,
      camOn,
      audio: Boolean(audioStreamRef.current?.getAudioTracks().length),
      video: Boolean(getOutgoingVideoTrack()),
    },
    participants: peerStates,
    peers: Array.from(peersRef.current.entries()).map(([socketId, { pc, stream }]) => ({
      socketId,
      connectionState: pc.connectionState,
      iceState: pc.iceConnectionState,
      signalingState: pc.signalingState,
      remoteAudio: stream.getAudioTracks().length,
      remoteVideo: stream.getVideoTracks().length,
    })),
  };

  return {
    micOn,
    camOn,
    screenSharing,
    recording,
    mediaError,
    mySocketId,
    localStream,
    waiting,
    removed,
    remoteStreams,
    peerStates,
    debug,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    toggleRecording,
    retryMedia,
    dismissError: () => setMediaError(null),
    getGuestToken,
  };
};

export default useMeetingRTC;
