import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { loadMessages, sendNewMessage } from "../../redux/slices/meetingSlice";
import { reactToMessage } from "../../utils/meetingApi";
import { formatTime } from "../../utils/dateUtils";
import { MessageSquare, Paperclip, X, FaceGrinning, LoaderCircle, Send } from "lucide-react";

const EMOJI_PICKER = ["👍", "❤️", "😂", "🎉", "👏", "🤔"];

const MeetingChatPanel = ({ meetingId, socket, canChat = true }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const userId = user?.user?.id;
  const guestEmail = (() => {
    try {
      return sessionStorage.getItem("meetingGuestEmail");
    } catch {
      return null;
    }
  })();
  const messages = useSelector((state) => state.meeting.messages);
  const messagesLoading = useSelector((state) => state.meeting.messagesLoading);

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const scrollRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (meetingId) dispatch(loadMessages({ meetingId, page: 1, limit: 100 }));
  }, [meetingId, dispatch]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (msg) => {
      if (msg?.meetingId || msg?.meeting) {
        dispatch(loadMessages({ meetingId, page: 1, limit: 100 }));
      }
    };
    const onTyping = ({ userId: uid, isTyping, name }) => {
      if (String(uid) === String(userId)) return;
      setTypingUsers((prev) => {
        const others = prev.filter((u) => String(u.userId) !== String(uid));
        return isTyping ? [...others, { userId: uid, name }] : others;
      });
    };
    const onReacted = ({ messageId, reactions }) => {
      dispatch({
        type: "meeting/updateMessageReactions",
        payload: { messageId, reactions },
      });
    };
    socket.on("meeting:chat", onMessage);
    socket.on("meeting:message", onMessage);
    socket.on("meeting:typing", onTyping);
    socket.on("meeting:chat:reacted", onReacted);
    return () => {
      socket.off("meeting:chat", onMessage);
      socket.off("meeting:message", onMessage);
      socket.off("meeting:typing", onTyping);
      socket.off("meeting:chat:reacted", onReacted);
    };
  }, [socket, meetingId, userId, dispatch]);

  const emitTyping = (isTyping) => {
    socket?.emit("meeting:typing", { meetingId, isTyping });
  };

  const handleChange = (value) => {
    setText(value);
    emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 1200);
  };

  const handleSend = async () => {
    if (!text.trim() && files.length === 0) return;
    setSending(true);
    try {
      const formData = new FormData();
      if (text.trim()) formData.append("text", text.trim());
      files.forEach((f) => formData.append("attachments", f));
      await dispatch(sendNewMessage({ meetingId, formData }));
      setText("");
      setFiles([]);
      emitTyping(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (messageId, emoji) => {
    try {
      await dispatch(reactToMessage(messageId, emoji));
    } catch {
      toast.error("Failed to add reaction");
    }
  };

  const isMine = (msg) => {
    if (msg.senderType === "guest") {
      return Boolean(guestEmail) && String(msg.senderEmail) === String(guestEmail);
    }
    return String(msg.sender?._id || msg.sender) === String(userId);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink-200/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-brand-500" />
          <h3 className="text-sm font-semibold text-ink-900">Meeting Chat</h3>
        </div>
        {!canChat && <span className="text-[10px] font-medium text-ink-400">Read only</span>}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3 scrollbar-thin">
        {messagesLoading && messages.length === 0 ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-2">
                <div className="skeleton h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/4" />
                  <div className="skeleton h-10 w-2/3 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-ink-400 pt-8">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className={`flex gap-2 ${isMine(msg) ? "flex-row-reverse" : ""}`}>
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  isMine(msg) ? "bg-brand-500" : "bg-ink-400"
                }`}>
                {(msg.senderName || "?").charAt(0).toUpperCase()}
              </div>
              <div className={`max-w-[75%] ${isMine(msg) ? "text-right" : ""}`}>
                <div className={`mb-0.5 flex items-baseline gap-2 ${isMine(msg) ? "flex-row-reverse" : ""}`}>
                  <span className="text-[11px] font-semibold text-ink-700">
                    {msg.senderName || "User"}
                    {msg.senderType === "guest" ? " (Guest)" : ""}
                  </span>
                  <span className="text-[10px] text-ink-400">{msg.createdAt ? formatTime(msg.createdAt) : ""}</span>
                </div>
                <div
                  className={`inline-block rounded-2xl px-3 py-2 text-left text-sm leading-relaxed break-words ${
                    isMine(msg)
                      ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white"
                      : "bg-ink-100/80 text-ink-800"
                  }`}>
                  {msg.text}
                </div>
                {(msg.attachments || []).filter((a) => a && a.url).map((a, i) => (
                  <a
                    key={i}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-1 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors ${
                      isMine(msg)
                        ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                        : "border-ink-200 bg-white text-ink-700 hover:border-brand-300"
                    }`}>
                    <Paperclip className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{a.filename || a.name || "Attachment"}</span>
                  </a>
                ))}
                {msg.reactions?.length > 0 && (
                  <div className={`mt-1 flex flex-wrap gap-1 ${isMine(msg) ? "justify-end" : ""}`}>
                    {msg.reactions.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => handleReact(msg._id, r.emoji)}
                        className="rounded-full bg-white px-2 py-0.5 text-xs ring-1 ring-ink-200/70 transition-transform hover:scale-105"
                        title={r.by?.name || r.by || "Reacted"}>
                        {r.emoji}{" "}
                        {msg.reactions.filter((x) => x.emoji === r.emoji).length > 1 && (
                          <span className="text-ink-500">{msg.reactions.filter((x) => x.emoji === r.emoji).length}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {typingUsers.length > 0 && (
        <p className="px-4 text-[11px] text-ink-400 italic">
          {typingUsers.map((u) => u.name || "Someone").join(", ")} typing...
        </p>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {files.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[11px] text-brand-700">
              {f.name}
              <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove file">
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}

      {canChat && (
        <div className="border-t border-ink-200/60 p-3">
          <div className="relative flex items-end gap-2">
            <label className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl text-ink-400 transition-colors hover:bg-ink-100/70 hover:text-brand-600" title="Attach file">
              <Paperclip className="h-5 w-5" />
              <input
                type="file"
                className="hidden"
                multiple
                onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])}
              />
            </label>
            <div className="relative flex-1">
              <input
                value={text}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                className="input-base !rounded-xl pr-9"
                aria-label="Message text"
              />
              <button
                onClick={() => setShowEmoji((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-brand-600"
                aria-label="Add emoji">
                <FaceGrinning className="h-5 w-5" />
              </button>
              {showEmoji && (
                <div className="absolute bottom-11 right-0 flex gap-1 rounded-xl border border-ink-200 bg-white p-2 shadow-lg animate-fade-in-up">
                  {EMOJI_PICKER.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setText((t) => t + emoji);
                        setShowEmoji(false);
                      }}
                      className="rounded-lg px-1.5 py-0.5 text-lg transition-transform hover:scale-125">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={sending || (!text.trim() && files.length === 0)}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-600/25 transition-all hover:shadow-lg disabled:opacity-40"
              aria-label="Send message">
              {sending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingChatPanel;
