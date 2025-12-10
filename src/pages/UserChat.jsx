// UserChat.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthProvider";
import { io } from "socket.io-client";
import { IoSend, IoSearch, IoEllipsisVertical, IoCheckmarkDone, IoCheckmark, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { MdOutlineMoreVert } from "react-icons/md";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function UserChat() {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("accessToken");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [typingUser, setTypingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentRoomRef = useRef(null);
  const getUserId = () => (user && (user.userId || user.id)) || null;

  // autoscroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => scrollToBottom(), [messages]);

  // Format message consistently for UI
  const formatMessage = (rawMsg) => {
    const uid = getUserId();
    const senderId = rawMsg.senderId ?? rawMsg.sender?.id ?? rawMsg.senderId;
    let senderName = "Unknown";

    if (rawMsg.sender) {
      senderName =
        `${rawMsg.sender.firstName || ""} ${rawMsg.sender.lastName || ""}`.trim() ||
        rawMsg.sender.email ||
        senderName;
    } else if (senderId) {
      const s = users.find((u) => u.id === senderId);
      if (s)
        senderName = `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.email;
      else if (senderId === uid)
        senderName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
    } else if (rawMsg.senderName) {
      senderName = rawMsg.senderName;
    }

    return {
      id:
        rawMsg.id ??
        rawMsg.msg_id ??
        `${senderId}-${rawMsg.createdAt ?? rawMsg.timestamp ?? Date.now()}`,
      roomId: rawMsg.roomId || currentRoomRef.current || rawMsg.chatRoomId,
      senderId,
      senderName,
      text: rawMsg.message ?? rawMsg.text ?? "",
      timestamp: rawMsg.createdAt ?? rawMsg.timestamp ?? new Date().toISOString(),
      seen: rawMsg.seen ?? false,
    };
  };

  useEffect(() => {
    if (!token || !user) {
      setLoading(false);
      setError("User not authenticated.");
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      autoConnect: false,
      path: "/socket.io",
      auth: { token },
      transportOptions: {
        polling: {
          extraHeaders: {
            token,
          },
        },
      },
    });

    socketRef.current = socket;

    const onConnect = () => {
      console.log("✅ Connected:", socket.id);
      setConnectionStatus("connected");
      setError(null);
      socket.emit("UserList", { page: 1, limit: 100, search: "" });
      socket.emit("online", { userId: getUserId() });
    };

    const onConnectError = (err) => {
      console.error("connect_error", err);
      setConnectionStatus("error");
      setError("Chat connection failed.");
      setLoading(false);
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);

    const onUserList = (response) => {
      console.log("📥 Received UserList:", response);
      if (response && response.success) {
        const normalized = (response.data || []).map((u) => ({
          ...u,
          onlineStatus: u.onlineStatus ?? u.onlineSatus ?? "offline",
        }));

        setUsers(normalized);

        setActiveUser((prev) => {
          if (!prev || !normalized.some((x) => x.id === prev.id)) {
            return normalized[0] || null;
          }
          return prev;
        });

        setLoading(false);
      } else {
        setError((response && response.error) || "Failed to load team members");
        setLoading(false);
      }
    };
    socket.on("UserList", onUserList);

    const onOnlineUser = (payload) => {
      if (!payload) return;
      if (payload.userId && payload.status) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === payload.userId ? { ...u, onlineStatus: payload.status } : u
          )
        );
      }
    };
    socket.on("onlineUser", onOnlineUser);

    const onMyChats = (response) => {
      console.log("📥 Received mychats response:", response);

      if (!response) {
        console.warn("Empty mychats response");
        return;
      }

      const room = response.roomId || currentRoomRef.current;
      if (!room) {
        console.warn("No room ID in mychats response");
        return;
      }

      let messagesArray = [];

      if (response.success && response.data) {
        if (response.data.text && Array.isArray(response.data.text)) {
          messagesArray = response.data.text;
        } else if (Array.isArray(response.data)) {
          messagesArray = response.data;
        } else if (response.data.messages && Array.isArray(response.data.messages)) {
          messagesArray = response.data.messages;
        }
      } else if (Array.isArray(response)) {
        messagesArray = response;
      } else if (response.messages && Array.isArray(response.messages)) {
        messagesArray = response.messages;
      } else if (response.text && Array.isArray(response.text)) {
        messagesArray = response.text;
      }

      console.log("📨 Processing messages array:", messagesArray);

      if (messagesArray.length === 0) {
        console.log("No messages found for room:", room);
        setMessages([]);
        return;
      }

      const formatted = messagesArray.map((m) =>
        formatMessage({ ...m, roomId: room })
      );

      setMessages(formatted.reverse());
      console.log("✅ Set messages:", formatted.length);
    };
    socket.on("mychats", onMyChats);

    const onReceiveMessage = (raw) => {
      console.log("📨 Received message:", raw);
      const msg = formatMessage(raw);

      if (msg.roomId !== currentRoomRef.current) {
        console.log("Message for different room, ignoring");
        return;
      }

      setMessages((prev) => {
        const duplicate = prev.some(
          (m) =>
            m.text === msg.text &&
            m.senderId === msg.senderId &&
            Math.abs(new Date(m.timestamp) - new Date(msg.timestamp)) < 2000
        );
        if (duplicate) {
          console.log("Duplicate message, ignoring");
          return prev;
        }
        return [...prev, msg];
      });
    };
    socket.on("receiveMessage", onReceiveMessage);

    const onTyping = (data) => {
      if (!data) return;
      const { roomId, userId, isTyping } = data;
      if (roomId && roomId === currentRoomRef.current && userId && userId !== getUserId()) {
        if (isTyping === false) {
          setTypingUser(null);
        } else {
          const u = users.find((x) => x.id === userId);
          const name = u
            ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email
            : "Someone";
          setTypingUser(name);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
        }
      }
    };
    socket.on("typing", onTyping);

    const onSeenMessage = (data) => {
      if (!data) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === data.msg_id ? { ...m, seen: true } : m))
      );
    };
    socket.on("seenMessage", onSeenMessage);

    const onDeleted = (d) => {
      if (d?.id) setMessages((prev) => prev.filter((m) => m.id !== d.id));
    };
    socket.on("Deleted", onDeleted);

    const onErrorMessage = (d) => {
      if (d?.error) setError(d.error);
    };
    socket.on("errorMessage", onErrorMessage);
    socket.on("error", (e) => {
      console.error("Socket error:", e);
      setError(e?.message || "Socket error");
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected:", reason);
      setConnectionStatus("disconnected");
    });

    socket.connect();

    return () => {
      console.log("🧹 Cleaning up socket");
      try {
        if (currentRoomRef.current) {
          socket.emit("leaveRoom", { roomId: currentRoomRef.current });
        }
      } catch (e) {
        /* ignore */
      }
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("UserList", onUserList);
      socket.off("onlineUser", onOnlineUser);
      socket.off("mychats", onMyChats);
      socket.off("receiveMessage", onReceiveMessage);
      socket.off("typing", onTyping);
      socket.off("seenMessage", onSeenMessage);
      socket.off("Deleted", onDeleted);
      socket.off("errorMessage", onErrorMessage);
      socket.off("error");
      socket.disconnect();
    };
  }, [user, token]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeUser || !user) return;

    if (currentRoomRef.current) {
      console.log("🚪 Leaving room:", currentRoomRef.current);
      socket.emit("leaveRoom", { roomId: currentRoomRef.current });
    }

    const id1 = getUserId();
    const id2 = activeUser.id;
    const roomId = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;

    setMessages([]);
    setTypingUser(null);
    setCurrentRoom(roomId);
    currentRoomRef.current = roomId;

    console.log("🚪 Joining room:", roomId);

    socket.emit("joinRoom", { roomId, type: "private", members: [] });

    setTimeout(() => {
      console.log("📥 Requesting chat history for room:", roomId);
      socket.emit("mychats", { roomId, page: 1, limit: 50 });
    }, 100);

    return () => {};
  }, [activeUser, user]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const input = e.target[0];
    const text = input.value.trim();
    if (!text || !activeUser) return;

    const socket = socketRef.current;
    if (!socket || socket.disconnected) {
      setError("Connection lost. Reconnecting...");
      socket?.connect();
      return;
    }

    console.log("📤 Sending message to room:", currentRoomRef.current);
    socket.emit("sendMessage", {
      roomId: currentRoomRef.current,
      message: text,
    });

    input.value = "";
  };

  const handleTypingStart = () => {
    const socket = socketRef.current;
    if (!socket || !currentRoomRef.current || !user) return;

    socket.emit("typing", {
      roomId: currentRoomRef.current,
      userId: getUserId(),
      isTyping: true,
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        roomId: currentRoomRef.current,
        userId: getUserId(),
        isTyping: false,
      });
    }, 1500);
  };

  const getFullName = (u) =>
    `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email;

  const getInitials = (u) => {
    const firstName = u.firstName || "";
    const lastName = u.lastName || "";
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return (u.email?.[0] || "?").toUpperCase();
  };

  const filteredUsers = users.filter((u) =>
    getFullName(u).toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="flex h-[80vh] bg-gray-50">
      {/* Sidebar - Users List */}
      <div className={`${isSidebarCollapsed ? 'w-20' : 'w-70'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        {/* Sidebar Header */}
        <div className="px-4 py-4 border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            {!isSidebarCollapsed && (
              <>
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === "connected"
                        ? "bg-green-500"
                        : connectionStatus === "error"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}
                  />
                  <span className="text-xs text-gray-500">
                    {connectionStatus === "connected"
                      ? "Online"
                      : connectionStatus === "error"
                      ? "Offline"
                      : "Connecting"}
                  </span>
                </div>
              </>
            )}
            {isSidebarCollapsed && (
              <div className="flex justify-center w-full">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === "connected"
                      ? "bg-green-500"
                      : connectionStatus === "error"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }`}
                />
              </div>
            )}
          </div>

          {/* Search Bar - Hidden when collapsed */}
          {!isSidebarCollapsed && (
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          )}
        </div>

        {/* Toggle Button */}
      

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              {!isSidebarCollapsed && <p className="text-sm text-gray-500">Loading conversations...</p>}
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <div className="text-sm text-red-600 mb-2">{!isSidebarCollapsed && error}</div>
              {!isSidebarCollapsed && (
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Retry
                </button>
              )}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {!isSidebarCollapsed && (searchQuery ? "No conversations found" : "No team members available")}
            </div>
          ) : (
            <div className="py-2">
              {filteredUsers.map((u) => {
                const isActive = activeUser?.id === u.id;
                const isOnline = u.onlineStatus === "online";
                
                return (
                  <div
                    key={u.id}
                    onClick={() => setActiveUser(u)}
                    title={isSidebarCollapsed ? getFullName(u) : ""}
                    className={`px-4 py-3 cursor-pointer transition-colors relative ${
                      isActive
                        ? "bg-blue-50 border-l-4 border-blue-600"
                        : "hover:bg-gray-50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                            isActive
                              ? "bg-gradient-to-br from-blue-500 to-blue-600"
                              : "bg-gradient-to-br from-gray-400 to-gray-500"
                          }`}
                        >
                          {getInitials(u)}
                        </div>
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      {!isSidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3
                              className={`font-medium text-sm truncate ${
                                isActive ? "text-blue-900" : "text-gray-900"
                              }`}
                            >
                              {getFullName(u)}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Footer - Current User Info */}
        {/* <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-xs">
              {getInitials(user)}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{getFullName(user)}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            )}
          </div>
        </div> */}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeUser ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                      {getInitials(activeUser)}
                    </div>
                    {activeUser.onlineStatus === "online" && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {getFullName(activeUser)}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {activeUser.onlineStatus === "online" ? "Active now" : "Offline"}
                    </p>
                  </div>
                </div>
               <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="-right-3 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors z-10"
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <IoChevronForward className="text-white" size={16} />
          ) : (
            <IoChevronBack className="text-white" size={16} />
          )}
        </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No messages yet
                  </h3>
                  <p className="text-sm text-gray-500">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    const msgKey = msg.id || `${msg.senderId}-${msg.timestamp}`;
                    const isOwnMessage = msg.senderId === getUserId();
                    const showTimestamp =
                      index === 0 ||
                      new Date(msg.timestamp).getTime() -
                        new Date(messages[index - 1].timestamp).getTime() >
                        300000; // 5 minutes

                    return (
                      <div key={msgKey}>
                        {showTimestamp && (
                          <div className="flex justify-center mb-4">
                            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                              {new Date(msg.timestamp).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-md px-4 py-2.5 rounded-2xl ${
                              isOwnMessage
                                ? "bg-blue-600 text-white rounded-br-md"
                                : "bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm"
                            }`}
                          >
                            {!isOwnMessage && (
                              <p className="text-xs font-medium mb-1 opacity-70">
                                {msg.senderName}
                              </p>
                            )}
                            <p className="text-sm leading-relaxed break-words">
                              {msg.text}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span
                                className={`text-xs ${
                                  isOwnMessage
                                    ? "text-blue-100"
                                    : "text-gray-400"
                                }`}
                              >
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {isOwnMessage && (
                                <span className="text-blue-100">
                                  {msg.seen ? (
                                    <IoCheckmarkDone size={14} />
                                  ) : (
                                    <IoCheckmark size={14} />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                  {typingUser && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {typingUser} is typing
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage}>
                <div className="flex items-end gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition resize-none"
                      disabled={connectionStatus !== "connected"}
                      onKeyDown={handleTypingStart}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={connectionStatus !== "connected"}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <IoSend size={20} />
                  </button>
                </div>
                {connectionStatus !== "connected" && (
                  <p className="text-xs text-red-500 mt-2">
                    {connectionStatus === "error"
                      ? "Connection failed. Please check your internet."
                      : "Reconnecting to chat server..."}
                  </p>
                )}
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-cengter h-full">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Select a conversation
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              Choose a team member from the list to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserChat;