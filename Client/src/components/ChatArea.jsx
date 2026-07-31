import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import Button from "./Button";
import InputBox from "./InputBox";

const ChatArea = ({ messages = [], onSend, otherUser, currentUserId, loading = false }) => {
  const [inputText, setInputText] = useState("");
  const bottomRef = useRef(null);

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
  }, [messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    onSend?.(text);
    setInputText("");
  };

  if (!otherUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400 text-sm">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          Select a conversation to start chatting
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="px-5 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{otherUser.name}</h2>
            {(otherUser.designation || otherUser.employeeId) && (
              <p className="text-xs text-gray-500">{otherUser.designation || otherUser.employeeId}</p>
            )}
          </div>
          <span className="text-xs font-medium flex items-center gap-1.5 text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Online
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/50 scrollbar-thin">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 ? "justify-start" : "justify-end"}`}>
                <div className="skeleton h-10 w-1/2 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = String(msg.sender) === String(myId);
            return (
              <div key={msg._id || msg.createdAt} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                    isSelf
                      ? "bg-brand-600 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-800 rounded-bl-md"
                  }`}>
                  {!isSelf && (
                    <p className="text-[10px] font-semibold text-gray-500 mb-0.5">
                      {msg.senderName || otherUser.name}
                    </p>
                  )}
                  <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isSelf ? "text-white/60" : "text-gray-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <InputBox
              id="chatInput"
              name="chatInput"
              placeholder="Type your message..."
              setInput={setInputText}
              getInput={inputText}
            />
          </div>
          <Button label="Send" onClick={handleSend} disabled={!inputText.trim()} />
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
};

export default ChatArea;
