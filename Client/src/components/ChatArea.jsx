import React, { useState } from "react";

const ChatArea = ({ selectedUser }) => {
  const [messages, setMessages] = useState({});
  const [inputText, setInputText] = useState("");
  const handleSendMessage = () => {
    if (inputText.trim() && selectedUser) {
      const userName = selectedUser.name;
      const newMessage = {
        text: inputText,
        time: new Date().toLocaleTimeString(),
        sender: "me",
      };

      setMessages((prev) => ({
        ...prev,
        [userName]: [...(prev[userName] || []), newMessage],
      }));

      setInputText("");
    }
  };
  return (
    <div className="w-full p-4 flex flex-col justify-between">
      {selectedUser ? (
        <>
          <div className="">
            <div className="flex flex-row justify-between items-center">
              <h2 className="text-xl font-semibold">{selectedUser.name}</h2>
              <span
                className={`ml-2 inline-block   ${
                  selectedUser.online ? "text-green-500" : "text-red-500"
                }`}>
                {selectedUser.online ? "Online" : "Offline"}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">{selectedUser.role}</p>
            <hr className="bg-black h-[1px] border-none my-2" />
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-2">
            {(messages[selectedUser.name] || []).map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-md max-w-[70%] ${
                  msg.sender === "me"
                    ? "bg-blue-100 self-end ml-auto"
                    : "bg-gray-200"
                }`}>
                <p className="text-sm">{msg.text}</p>
                <span className="text-xs text-gray-500">{msg.time}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 p-2 border border-gray-400 rounded-md"
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Send
            </button>
          </div>
        </>
      ) : (
        <div className="text-gray-500 text-center mt-20">
          Select a user to start chatting
        </div>
      )}
    </div>
  );
};

export default ChatArea;
