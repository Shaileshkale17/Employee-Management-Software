import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import ChatArea from "../components/ChatArea";
import EmptyState from "../components/EmptyState";
import SelectBox from "../components/SelectBox";
import { api, getToken, SOCKET_URL } from "../utils/api";

const HR_ROLES = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"];

const Message = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.user?.role;
  const userId = user?.user?.id;

  const SideNav = (r) => (HR_ROLES.includes(r) ? <HRSideNavber /> : <SideNavbar />);

  const socketRef = useRef(null);
  const activeIdRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [directory, setDirectory] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newChat, setNewChat] = useState("");

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get("/message/all");
      setConversations(res.data.data || []);
    } catch {
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!userId) return;
    api
      .get("/emp/directory")
      .then((res) =>
        setDirectory((res.data.data || []).filter((d) => String(d._id) !== String(userId)))
      )
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("authenticate", { token: getToken() });
      socket.emit("register", String(userId));
    });
    socket.on("chat:message", (msg) => {
      if (msg && String(msg.sender) === String(activeIdRef.current)) {
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      }
      fetchConversations();
    });
    return () => {
      socket.off("chat:message");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, fetchConversations]);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const findUser = (id) => {
    const conv = conversations.find((c) => String(c._id) === String(id));
    if (conv?.user) return conv.user;
    return directory.find((d) => String(d._id) === String(id)) || { _id: id, name: id };
  };

  const openConversation = async (id) => {
    setActiveId(id);
    setActiveUser(findUser(id));
    setChatLoading(true);
    try {
      const res = await api.get("/message", { params: { with: id } });
      setMessages(res.data.data || []);
      await api.put("/message/read", { with: id });
      fetchConversations();
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setChatLoading(false);
    }
  };

  const handleNewChat = (id) => {
    setNewChat(id);
    if (id) openConversation(id);
  };

  const sendMessage = async (text) => {
    if (!activeId) return;
    try {
      const res = await api.post("/message/", { recipient: activeId, text });
      const sent = res.data.data || res.data;
      if (sent) {
        setMessages((prev) => (prev.some((m) => m._id === sent._id) ? prev : [...prev, sent]));
      }
      fetchConversations();
    } catch {
      toast.error("Failed to send message");
    }
  };

  const formatTime = (t) => {
    if (!t) return "";
    return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex">
      {SideNav(role)}
      <div className="flex-1 flex h-[calc(100vh-4rem)] bg-surface-100">
        <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100 space-y-3">
            <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
            <SelectBox
              label="New Chat"
              id="newChat"
              name="newChat"
              option={directory.map((d) => ({
                value: d._id,
                label: `${d.name}${d.designation ? ` — ${d.designation}` : ""}${d.employeeId ? ` (${d.employeeId})` : ""}`,
              }))}
              setInput={handleNewChat}
              getInput={newChat}
            />
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
            {loading ? (
              <div className="space-y-2 p-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton h-14 rounded-xl" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <EmptyState title="No conversations yet" description="Pick someone from New Chat to start messaging." />
            ) : (
              conversations.map((c) => {
                const isActive = String(c._id) === String(activeId);
                const name = c.user?.name || c._id;
                const subtitle = c.user?.designation || c.user?.employeeId || "";
                return (
                  <button
                    key={c._id}
                    onClick={() => openConversation(c._id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-3 mb-1 ${
                      isActive ? "bg-brand-600 text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}>
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isActive ? "bg-white" : "bg-green-400"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{name}</p>
                        <span className={`text-[10px] ${isActive ? "text-white/70" : "text-gray-400"} flex-shrink-0`}>
                          {formatTime(c.lastMessageAt)}
                        </span>
                      </div>
                      {subtitle && (
                        <p className={`text-xs ${isActive ? "text-white/70" : "text-gray-400"} truncate`}>{subtitle}</p>
                      )}
                      <p className={`text-xs truncate ${isActive ? "text-white/70" : "text-gray-500"}`}>
                        {String(c.lastSender) === String(userId) ? "You: " : ""}
                        {c.lastMessage || "No messages yet"}
                      </p>
                      {c.unread > 0 && !isActive && (
                        <span className="inline-flex items-center justify-center mt-1 min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-medium">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <ChatArea
            messages={messages}
            onSend={sendMessage}
            otherUser={activeUser}
            currentUserId={userId}
            loading={chatLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default Message;
