import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from "../context/AuthProvider";
import { io } from 'socket.io-client';
import { IoSend } from "react-icons/io5";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function UserChat() {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem('accessToken');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [typingUser, setTypingUser] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => scrollToBottom(), [messages]);

  const formatMessage = (rawMsg) => {
    let senderName = 'Unknown';
    if (rawMsg.sender) {
      senderName = `${rawMsg.sender.firstName || ''} ${rawMsg.sender.lastName || ''}`.trim() || rawMsg.sender.email;
    } else if (rawMsg.senderName) {
      senderName = rawMsg.senderName;
    }

    return {
      id: rawMsg.id,
      roomId: rawMsg.roomId || currentRoom,
      senderId: rawMsg.senderId,
      senderName,
      text: rawMsg.message || rawMsg.text || '',
      timestamp: rawMsg.createdAt || rawMsg.timestamp || new Date().toISOString(),
    };
  };

  // ---------------- SOCKET SETUP ----------------
  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('User not authenticated.');
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      transportOptions: {
        polling: { extraHeaders: { token } }
      },
      autoConnect: false,
      path: '/socket.io'
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected:', socket.id);
      setConnectionStatus('connected');
      setError(null);
      socket.emit('UserList', { page: 1, limit: 100, search: "" });
      socket.emit('online', { userId: user.id });
    });

    socket.on('connect_error', err => {
      setConnectionStatus('error');
      setError('Chat connection failed.');
      setLoading(false);
    });

socket.on("disconnect", async () => {
  try {
    await User.update(
      { onlineStatus: "offline" },
      { where: { id: userId } }
    );

    io.emit("onlineUser", {
      userId,
      status: "offline"
    });

  } catch (err) {
    console.error("Disconnect error:", err);
  }
});


socket.on("UserList", async ({ page = 1, limit = 10, search = "" }) => {
  try {
    const offset = (page - 1) * limit;
    search = typeof search === "string" ? search.trim() : "";

    const childIds = await getAllChildUserIds(userId);
    const validUserIds = [userId, ...childIds];

    let userSearchCondition = {};

    if (search !== "") {
      userSearchCondition = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email:  { [Op.iLike]: `%${search}%` } },
        ]
      };
    }

    const result = await ChatParticipant.findAndCountAll({
      where: {
        userId: validUserIds,
      },
      limit,
      offset,
      order: [["id", "DESC"]],
      include: [
        {
          model: User,
          as: "user", 
          attributes: ["id", "firstName", "lastName", "email", "role", "onlineStatus"],
          where: userSearchCondition,
          required: false,
        }
      ]
    });

    io.to(socket.id).emit("UserList", {
      success: true,
      total: result.count,
      totalPages: Math.ceil(result.count / limit),
      currentPage: page,
      data: result.rows,
    });

  } catch (error) {
    console.error("UserList Error:", error);
    socket.emit("UserList", {
      success: false,
      error: "Unable to fetch user list",
    });
  }
});


// --------------------------------------------------------
// SEND MESSAGE
// --------------------------------------------------------
socket.on("sendMessage", async ({ roomId, message }) => {
  try {
    const room = await ChatRoom.findOne({ where: { roomId } });
    if (!room)
      return socket.emit("errorMessage", { error: "Invalid roomId" });

    const isParticipant = await ChatParticipant.findOne({
      where: { chatRoomId: room.id, userId },
    });

    if (!isParticipant) {
      return socket.emit("errorMessage", {
        error: "You are not a room member",
      });
    }

    const newMessage = await Message.create({
      chatRoomId: room.id,
      senderId: userId,
      message,
    });

    io.to(roomId).emit("receiveMessage", newMessage);
  } catch (error) {
    console.error("Send message error:", error);
    socket.emit("errorMessage", { error: "Failed to send message" });
  }
});


// --------------------------------------------------------
// TYPING INDICATOR
// --------------------------------------------------------
socket.on("typing", (data) => {
  io.to(data.roomId).emit("typing", data);
});


// --------------------------------------------------------
// ONLINE STATUS (FIXED)
// --------------------------------------------------------
socket.on("online", async ({ userId }) => {
  try {
    await User.update(
      { onlineStatus: "online" },
      { where: { id: userId } }
    );

    io.emit("onlineUser", {
      userId,
      status: "online"
    });

  } catch (err) {
    console.error("Online error:", err);
  }
});


// --------------------------------------------------------
// OFFLINE STATUS ON DISCONNECT
// --------------------------------------------------------
socket.on("disconnect", async () => {
  try {
    await User.update(
      { onlineStatus: "offline" },
      { where: { id: userId } }
    );

    io.emit("onlineUser", {
      userId,
      status: "offline"
    });

  } catch (err) {
    console.error("Disconnect error:", err);
  }
});

    socket.on('errorMessage', d => setError(d.error || 'Error'));
    socket.on('error', err => setError(err.message || 'Error'));

    socket.connect();

    return () => {
      if (currentRoom) socket.emit('leaveRoom', { roomId: currentRoom });
      socket.disconnect();
    };
  }, [user, token]);

  // ---------------- ROOM JOIN / MESSAGES ----------------
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeUser || !user) return;

    if (currentRoom) socket.emit('leaveRoom', { roomId: currentRoom });

    const id1 = user.id;
    const id2 = activeUser.id;
    const roomId = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;

    setMessages([]);
    setTypingUser(null);
    setCurrentRoom(roomId);

    socket.emit('joinRoom', { roomId, type: 'private' });

    const handleRoomJoined = (data) => {
      if (Array.isArray(data.messages)) {
        setMessages(data.messages.map(formatMessage));
      }
    };

    const handleMessage = raw => {
      const msg = formatMessage({ ...raw, roomId: currentRoom });
      setMessages(prev => {
        const isDuplicate = prev.some(m =>
          m.text === msg.text &&
          m.senderId === msg.senderId &&
          Math.abs(new Date(m.timestamp) - new Date(msg.timestamp)) < 2000
        );
        return isDuplicate ? prev : [...prev, msg];
      });
    };

    const handleTyping = ({ userId, isTyping }) => {
      if (userId !== user.id && isTyping) {
        const u = users.find(u => u.id === userId);
        if (u) {
          setTypingUser(getFullName(u));
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(
            () => setTypingUser(null),
            3000
          );
        }
      }
    };

    socket.on('roomJoined', handleRoomJoined);
    socket.on('receiveMessage', handleMessage);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('roomJoined', handleRoomJoined);
      socket.off('receiveMessage', handleMessage);
      socket.off('typing', handleTyping);
    };
  }, [activeUser, user]);

  const getFullName = (u) =>
    `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;

  const handleSendMessage = (e) => {
    e.preventDefault();
    const input = e.target[0];
    const text = input.value.trim();
    if (!text || !activeUser) return;

    socketRef.current.emit('sendMessage', { roomId: currentRoom, message: text });
    input.value = '';
  };

  const handleTypingStart = () => {
    socketRef.current?.emit('typing', {
      roomId: currentRoom,
      userId: user.id,
      isTyping: true
    });
  };

  if (!user) {
    return <div>Loading user...</div>;
  }
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="py-4 px-6 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800">Team Chat</h1>
            <p className="text-sm text-slate-500 mt-1">
              Connected as {getFullName(user)} ({user.role})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${connectionStatus === 'connected'
                ? 'bg-green-100 text-green-700'
                : connectionStatus === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
              {connectionStatus === 'connected' ? '🟢 Connected' :
                connectionStatus === 'error' ? '🔴 Error' :
                  '🟡 Connecting...'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden px-4 py-4">
        <div className="flex h-full gap-4">
          {/* Left Panel - Users List */}
          <div className="w-full lg:w-80 flex flex-col h-full">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="text-lg font-medium text-slate-700">
                  {user.role === 'admin' ? 'Managers' : 'My Team'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {users.length} member{users.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 pt-2">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-sm">Connecting to chat...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-6">
                    <div className="text-sm text-red-600 mb-3">{error}</div>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-6 text-sm text-slate-500">
                    No team members available.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.map(u => (
                      <div
                        key={u.id}
                        onClick={() => setActiveUser(u)}
                        className={`relative rounded-2xl border p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${activeUser?.id === u.id
                            ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${activeUser?.id === u.id ? 'bg-blue-600' : 'bg-slate-400'
                              }`}>
                              {(u.firstName?.[0] || u.email?.[0] || '?').toUpperCase()}
                            </div>
                            {u.onlineStatus === 'online' && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium capitalize truncate">
                              {getFullName(u)}
                            </div>
                            <div className="text-xs opacity-80 truncate">
                              {u.email}
                            </div>
                            <div className="text-xs opacity-70 mt-1">
                              {user.role === 'admin' ? 'Manager' : 'Salesperson'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Chat */}
          <div className="flex-1 flex flex-col h-full min-w-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
              {activeUser ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                          {(activeUser.firstName?.[0] || activeUser.email?.[0] || '?').toUpperCase()}
                        </div>
                        {activeUser.onlineStatus === 'online' && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium capitalize">
                          {getFullName(activeUser)}
                        </h3>
                        <p className="text-sm text-slate-500">{activeUser.email}</p>
                      </div>
                      {currentRoom && (
                        <div className="text-xs text-slate-400 font-mono">
                          Room: {currentRoom.slice(0, 8)}...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                        <svg className="w-16 h-16 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <p className="text-lg font-medium">No messages yet</p>
                        <p className="text-sm mt-1">Start the conversation!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((msg) => {
                          const msgKey = msg.id || `${msg.senderId}-${msg.timestamp}`;
                          const isOwnMessage = msg.senderId === user.id;
                          return (
                            <div
                              key={msgKey}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md p-3 rounded-2xl shadow-sm ${isOwnMessage
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200'
                                  }`}
                              >
                                {!isOwnMessage && msg.senderName && (
                                  <p className="text-xs font-medium mb-1 opacity-70">
                                    {msg.senderName}
                                  </p>
                                )}
                                <p className="break-words">{msg.text}</p>
                                {msg.timestamp && (
                                  <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-slate-400'
                                    }`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                        {typingUser && (
                          <div className="flex justify-start">
                            <div className="bg-slate-200 text-slate-600 text-xs italic px-3 py-1 rounded-full">
                              {typingUser} is typing...
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-slate-100 bg-white">
                    <form onSubmit={handleSendMessage} className="relative">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="w-full px-4 py-3 pr-12 rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        disabled={connectionStatus !== 'connected'}
                        onKeyDown={handleTypingStart}
                      />
                      <button
                        type="submit"
                        disabled={connectionStatus !== 'connected'}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <IoSend />
                      </button>
                    </form>
                    {connectionStatus !== 'connected' && (
                      <p className="text-xs text-red-500 mt-2 text-center">
                        {connectionStatus === 'error' ? 'Connection failed' : 'Reconnecting...'}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-500 px-6">
                  <svg className="w-20 h-20 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg font-medium">Select a team member</p>
                  <p className="text-sm mt-1">Choose someone from the list to start chatting.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserChat;