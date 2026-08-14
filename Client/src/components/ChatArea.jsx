import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import Button from "./Button";
import InputBox from "./InputBox";
import { MessageSquare, Check } from "lucide-react";

const ChatArea = ({
  messages = [],
  onSend,
  otherUser,
  currentUserId,
  loading = false,
  typing = false,
  onTyping,
  presence = "offline",
}) => {
  const [inputText, setInputText] = useState("");
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

  const getCurrentUserId = () => {
    if (currentUserId) return currentUserId;
    try {
      return JSON.parse(localStorage.getItem("user"))?.user?.id || null;
    } catch {
      return null;
    }
  };
  const myId = getCurrentUserId();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    onSend?.(text);
    setInputText("");
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    onTyping?.(false);
  };

  const handleInputChange = (value) => {
    setInputText(value);
    onTyping?.(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => onTyping?.(false), 1200);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const presenceConfig = {
    online: { label: "Online", text: "text-emerald-600", dot: "bg-emerald-400" },
    away: { label: "Away", text: "text-amber-600", dot: "bg-amber-400" },
    busy: { label: "Busy", text: "text-red-600", dot: "bg-red-400" },
    idle: { label: "Idle", text: "text-amber-600", dot: "bg-amber-300" },
    offline: { label: "Offline", text: "text-ink-400", dot: "bg-ink-300" },
  };
  const presenceUi = presenceConfig[presence] || presenceConfig.offline;

  if (!otherUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-ink-400 text-sm">
          <div className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-card ring-1 ring-ink-200/60">
            <MessageSquare className="w-8 h-8 text-ink-300" strokeWidth={1.8} />
          </div>
          Select a conversation to start chatting
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="px-5 py-3.5 border-b border-ink-200/60 bg-white/60 backdrop-blur-sm dark:bg-white/5 dark:border-ink-700/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-sm font-semibold">
                {(otherUser.name || "?").charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full bg-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink-950">{otherUser.name}</h2>
              {(otherUser.designation || otherUser.employeeId) && (
                <p className="text-xs text-ink-500">{otherUser.designation || otherUser.employeeId}</p>
              )}
            </div>
          </div>
          <span className={`text-xs font-medium flex items-center gap-1.5 ${presenceUi.text}`}>
            <span className={`w-2 h-2 rounded-full ${presenceUi.dot} ${typing ? "animate-pulse-soft" : ""}`} />
            {typing ? (
              <span className="italic text-brand-600">typing…</span>
            ) : (
              <span>{presenceUi.label}</span>
            )}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-surface-100/70 scrollbar-thin">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 ? "justify-start" : "justify-end"}`}>
                <div className="skeleton h-10 w-1/2 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-ink-400 text-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = String(msg.sender) === String(myId);
            return (
              <div key={msg._id || msg.createdAt} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                <div
                  className={`relative max-w-[75%] px-4 py-2.5 rounded-2xl ${
                    isSelf
                      ? "bg-gradient-to-br from-brand-600 to-brand-500 text-white rounded-br-md shadow-md shadow-brand-600/20"
                      : "bg-white text-ink-800 rounded-bl-md shadow-card ring-1 ring-ink-200/50"
                  }`}>
                  {!isSelf && (
                    <p className="text-[10px] font-semibold text-brand-600 mb-0.5">
                      {msg.senderName || otherUser.name}
                    </p>
                  )}
                  <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-[10px] mt-1 flex items-center gap-1 ${isSelf ? "text-white/60 justify-end" : "text-ink-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {isSelf && (
                      <span
                        className={`inline-flex items-center gap-0.5 ${msg.read ? "text-sky-300" : "text-white/50"}`}
                        title={msg.read ? "Read" : "Delivered"}>
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                        {msg.read && (
                          <Check className="h-3 w-3 -ml-1" strokeWidth={2.5} />
                        )}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-ink-200/60 dark:bg-white/5 dark:border-ink-700/40">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <InputBox
              id="chatInput"
              name="chatInput"
              placeholder="Type your message..."
              setInput={handleInputChange}
              getInput={inputText}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button
            label="Send"
            onClick={handleSend}
            disabled={!inputText.trim()}
            aria-label="Send message"
          />
        </div>
      </div>
    </div>
  );
};

ChatArea.propTypes = {
  messages: PropTypes.array,
  onSend: PropTypes.func,
  otherUser: PropTypes.object,
  currentUserId: PropTypes.string,
  loading: PropTypes.bool,
  typing: PropTypes.bool,
  onTyping: PropTypes.func,
  presence: PropTypes.string,
};

export default ChatArea;
