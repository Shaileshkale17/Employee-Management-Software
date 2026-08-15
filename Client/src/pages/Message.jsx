import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import ChatArea from "../components/ChatArea";
import EmptyState from "../components/EmptyState";
import SelectBox from "../components/SelectBox";
import { MessageSquare, ArrowLeft } from "lucide-react";
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
  const [presenceMap, setPresenceMap] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newChat, setNewChat] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mobileView, setMobileView] = useState("list");

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
      .then((res) => {
        const list = (res.data.data || []).filter((d) => String(d._id) !== String(userId));
        setDirectory(list);
        setPresenceMap((prev) => {
          const next = { ...prev };
          list.forEach((d) => {
            next[String(d._id)] = { presence: d.presence || "offline", lastActive: d.lastActive };
          });
          return next;
        });
      })
      .catch(() => {});
  }, [userId]);

  const emitPresence = (presence) => {
    socketRef.current?.emit("presence:update", { presence });
  };

  useEffect(() => {
    const onVisibility = () => emitPresence(document.visibilityState === "hidden" ? "idle" : "online");
    const onUnload = () => emitPresence("offline");
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("authenticate", { token: getToken() });
      socket.emit("register", String(userId));
      socket.emit("presence:update", { presence: "online" });
    });
    socket.on("chat:message", (msg) => {
      if (msg && String(msg.sender) === String(activeIdRef.current)) {
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      }
      fetchConversations();
    });
    socket.on("chat:typing", ({ userId: uid, isTyping: typing }) => {
      if (uid && String(uid) === String(activeIdRef.current)) {
        setIsTyping(Boolean(typing));
      }
    });
    socket.on("chat:read", ({ with: withId, readAt }) => {
      if (withId && String(withId) === String(activeIdRef.current)) {
        setMessages((prev) =>
          prev.map((m) =>
            String(m.sender) === String(userId) ? { ...m, read: true, readAt } : m
          )
        );
      }
    });
    socket.on("presence:update", ({ userId: uid, presence, lastActive }) => {
      if (!uid) return;
      setPresenceMap((prev) => ({ ...prev, [String(uid)]: { presence, lastActive } }));
      setConversations((prev) =>
        prev.map((c) =>
          String(c._id) === String(uid) && c.user ? { ...c, user: { ...c.user, presence } } : c
        )
      );
    });
    return () => {
      socket.off("chat:message");
      socket.off("chat:typing");
      socket.off("chat:read");
      socket.off("presence:update");
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
    setMobileView("chat");
    setChatLoading(true);
    setIsTyping(false);
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

  const emitTyping = (typing) => {
    if (!activeId) return;
    socketRef.current?.emit("chat:typing", { recipient: activeId, isTyping: typing });
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
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(role)}
      <main className="flex-1 flex h-[100vh] h-[calc(100dvh-4rem)] bg-mesh-light">
        <div className={`${mobileView === "chat" ? "hidden md:flex" : "flex"} w-full sm:w-72 lg:w-80 flex-shrink-0 bg-white/80 backdrop-blur-sm border-r border-ink-200/60 flex-col dark:bg-white/5 dark:border-ink-700/40`}>
          <div className="p-4 border-b border-ink-100 space-y-3">
            <h1 className="text-lg font-semibold text-ink-950 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-brand-600" />
              Messages
            </h1>
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
                const presence = presenceMap[String(c._id)]?.presence || c.user?.presence || "offline";
                const dotColor = {
                  online: "bg-emerald-400",
                  away: "bg-amber-400",
                  busy: "bg-red-400",
                  idle: "bg-amber-300",
                  offline: "bg-ink-300",
                }[presence] || "bg-ink-300";
                return (
                  <button
                    key={c._id}
                    onClick={() => openConversation(c._id)}
                    aria-label={`Open conversation with ${name}`}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-3 mb-1 focus-ring ${
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-ink-600 hover:text-ink-950 hover:bg-ink-50"
                    }`}>
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isActive ? "bg-brand-500" : dotColor}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{name}</p>
                        <span className={`text-[10px] ${isActive ? "text-brand-600/70" : "text-ink-400"} flex-shrink-0`}>
                          {formatTime(c.lastMessageAt)}
                        </span>
                      </div>
                      {subtitle && (
                        <p className={`text-xs ${isActive ? "text-brand-600/70" : "text-ink-400"} truncate`}>{subtitle}</p>
                      )}
                      <p className={`text-xs truncate ${isActive ? "text-brand-600/70" : "text-ink-500"}`}>
                        {String(c.lastSender) === String(userId) ? "You: " : ""}
                        {c.lastMessage || "No messages yet"}
                      </p>
                      {c.unread > 0 && !isActive && (
                        <span className="inline-flex items-center justify-center mt-1 min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-medium shadow-sm">
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
        <div className={`${mobileView === "list" ? "hidden md:flex" : "flex"} flex-1 min-w-0 flex-col`}>
          <div className="md:hidden flex items-center gap-2 border-b border-ink-200/60 bg-white/60 px-3 py-2 dark:bg-white/5 dark:border-ink-700/40">
            <button
              type="button"
              onClick={() => setMobileView("list")}
              aria-label="Back to conversations"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">
              {activeUser?.name || "Messages"}
            </span>
          </div>
          <ChatArea
            messages={messages}
            onSend={sendMessage}
            otherUser={activeUser}
            currentUserId={userId}
            loading={chatLoading}
            typing={isTyping}
            onTyping={emitTyping}
            presence={presenceMap[String(activeId)]?.presence || activeUser?.presence || "offline"}
          />
        </div>
      </main>
    </div>
  );
};

export default Message;
