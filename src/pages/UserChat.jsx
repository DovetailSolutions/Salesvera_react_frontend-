// UserChat.jsx — Fully synced with backend socket events
import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import { AuthContext } from "../context/AuthProvider";
import { io } from "socket.io-client";
import {
  IoSend, IoSearch, IoAdd, IoCheckmarkDone, IoCheckmark,
  IoChevronBack, IoChevronForward, IoClose, IoEllipsisVertical,
  IoTrash, IoExit, IoPencil, IoArrowUndo,
  IoPersonAdd, IoPersonRemove,
  IoArrowForward, IoPeople, IoAttach, IoDocument, IoMusicalNote,
  IoVideocam, IoImage, IoDownload, IoCloudUpload,
} from "react-icons/io5";
import { HiUserGroup } from "react-icons/hi";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const MAX_FILE_MB = 25;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getFullName = (u) => {
  if (!u) return "Unknown";
  return `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "Unknown";
};

const getInitials = (u) => {
  if (!u) return "?";
  if (u.type === "group" && u.groupName) return u.groupName.substring(0, 2).toUpperCase();
  const f = u.firstName || "", l = u.lastName || "";
  if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
  if (u.groupName) return u.groupName.substring(0, 2).toUpperCase();
  return (u.email?.[0] || "?").toUpperCase();
};

const timeStr = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const dateStr = (ts) =>
  new Date(ts).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const buildRoomId = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

const getMediaCategory = (mediaType, mediaUrl) => {
  const t = (mediaType || "").toLowerCase();
  if (t === "image" || /\.(jpe?g|png|gif|webp)$/i.test(mediaUrl || "")) return "image";
  if (t === "video" || /\.(mp4|webm|ogv)$/i.test(mediaUrl || "")) return "video";
  if (t === "audio" || /\.(mp3|ogg|wav|m4a)$/i.test(mediaUrl || "")) return "audio";
  return "document";
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ entity, size = 11, ring = false }) {
  const isGroup = entity?.type === "group";
  const online = entity?.onlineStatus === "online";
  const sz = `w-${size} h-${size}`;
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm
        ${isGroup ? "bg-gradient-to-br from-violet-500 to-fuchsia-600" : "bg-gradient-to-br from-sky-500 to-blue-600"}
        ${ring ? "ring-2 ring-white" : ""}`}>
        {isGroup ? <HiUserGroup size={size * 2} /> : getInitials(entity)}
      </div>
      {!isGroup && online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
      )}
    </div>
  );
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[88vh]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          <div onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <IoClose size={20} />
          </div>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-4">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl flex justify-end gap-2 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="relative">
      <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all" />
    </div>
  );
}

function MenuItem({ icon, label, onClick, variant = "default" }) {
  const colors = { default: "text-gray-700 hover:bg-gray-50", danger: "text-red-600 hover:bg-red-50", warning: "text-orange-600 hover:bg-orange-50" };
  return (
    <div onClick={onClick} className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${colors[variant]}`}>
      {icon}<span>{label}</span>
    </div>
  );
}

function NotificationToast({ notification, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 4000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl shadow-2xl border border-gray-100 px-4 py-3 min-w-[280px] max-w-sm cursor-pointer hover:bg-gray-50 transition-colors"
      style={{ animation: 'slideInRight 0.3s ease-out' }}
      onClick={() => onDismiss(notification.id)}>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {(notification.senderName?.[0] || "?").toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 truncate">{notification.senderName}</p>
        <p className="text-xs text-gray-500 truncate">{notification.text || "\ud83d\udcce Sent a file"}</p>
      </div>
      <div onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
        className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
        <IoClose size={14} />
      </div>
    </div>
  );
}

function MediaBubble({ msg, own }) {
  const category = getMediaCategory(msg.mediaType, msg.mediaUrl);
  const bgAccent = own ? "bg-blue-500/40 border-blue-400/30" : "bg-gray-100 border-gray-200";
  const fileName = msg.originalName || msg.mediaUrl?.split("/").pop() || "File";

  if (category === "image") {
    return (
      <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
        <img src={msg.mediaUrl} alt={fileName} loading="lazy"
          className="rounded-xl max-w-full max-h-64 object-cover shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity" />
      </a>
    );
  }
  if (category === "video") {
    return <video src={msg.mediaUrl} controls className="rounded-xl max-w-full max-h-56 mb-2 shadow-sm" />;
  }
  if (category === "audio") {
    return (
      <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 mb-2 border ${bgAccent}`}>
        <div className={`p-2 rounded-lg ${own ? "bg-blue-400/40" : "bg-gray-200"}`}>
          <IoMusicalNote size={18} className={own ? "text-white" : "text-gray-600"} />
        </div>
        <audio controls src={msg.mediaUrl} className="flex-1 h-8 min-w-0" style={{ accentColor: own ? "#fff" : "#3b82f6" }} />
      </div>
    );
  }
  return (
    <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" download={fileName}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 mb-2 border ${bgAccent} hover:opacity-80 transition-opacity`}>
      <div className={`p-2.5 rounded-lg flex-shrink-0 ${own ? "bg-blue-400/40" : "bg-blue-50"}`}>
        <IoDocument size={20} className={own ? "text-white" : "text-blue-500"} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate ${own ? "text-white" : "text-gray-800"}`}>{fileName}</p>
        {msg.fileSize && <p className={`text-[10px] ${own ? "text-blue-200" : "text-gray-400"}`}>{formatBytes(msg.fileSize)}</p>}
      </div>
      <IoDownload size={16} className={own ? "text-blue-200" : "text-gray-400"} />
    </a>
  );
}

function FilePreview({ file, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const category = getMediaCategory(file.type.split("/")[0], file.name);

  useEffect(() => {
    if (category === "image" || category === "video") {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, category]);

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm">
      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {category === "image" && previewUrl
          ? <img src={previewUrl} alt="preview" className="w-full h-full object-cover rounded-lg" />
          : category === "video" ? <IoVideocam size={20} className="text-blue-500" />
            : category === "audio" ? <IoMusicalNote size={20} className="text-blue-500" />
              : <IoDocument size={20} className="text-blue-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{file.name}</p>
        <p className="text-[10px] text-gray-400">{formatBytes(file.size)}</p>
      </div>
      <div onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors flex-shrink-0">
        <IoClose size={15} />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function UserChat() {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("accessToken");

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [typingUser, setTypingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [messageText, setMessageText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [forwardSearch, setForwardSearch] = useState("");

  // File upload state
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [createModalSearch, setCreateModalSearch] = useState("");

  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [editNameMode, setEditNameMode] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);

  // Notification & pagination state
  const [unreadCounts, setUnreadCounts] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const currentRoomRef = useRef(null);
  const activeChatRef = useRef(null);
  const textareaRef = useRef(null);
  const menuRef = useRef(null);
  const attachMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const notifIdRef = useRef(0);
  const currentPageRef = useRef(1);
  const totalPagesRef = useRef(1);

  const getUserId = useCallback(() => (user && (user.userId || user.id)) || null, [user]);

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  // Auto-scroll for new messages; preserve position when loading older
  useEffect(() => {
    if (isLoadingMoreRef.current && chatContainerRef.current) {
      const newScrollHeight = chatContainerRef.current.scrollHeight;
      chatContainerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
      return;
    }
    // Use requestAnimationFrame to ensure DOM is fully rendered before scrolling
    requestAnimationFrame(() => {
      const el = chatContainerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }, [messages]);

  // ── Notification helpers ─────────────────────────────────────────────────
  const addNotification = useCallback((notif) => {
    const id = ++notifIdRef.current;
    setNotifications(prev => [...prev.slice(-4), { ...notif, id }]);
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearUnreadCount = useCallback((roomId) => {
    setUnreadCounts(prev => {
      if (!prev[roomId]) return prev;
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
  }, []);

  // ── Load older messages on scroll up ─────────────────────────────────────
  const handleScrollUp = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el || isLoadingMoreRef.current || !currentRoomRef.current) return;
    if (el.scrollTop < 80 && currentPageRef.current < totalPagesRef.current) {
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
      prevScrollHeightRef.current = el.scrollHeight;
      const nextPage = currentPageRef.current + 1;
      currentPageRef.current = nextPage;
      setCurrentPage(nextPage);
      socketRef.current?.emit("mychats", {
        roomId: currentRoomRef.current,
        page: nextPage,
      });
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowGroupMenu(false);
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) setShowAttachMenu(false);
      if (contextMenu) setContextMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [contextMenu]);

  // ── Format a raw message from the server ─────────────────────────────────
  const formatMessage = useCallback((raw) => {
    const uid = getUserId();
    const senderId = raw.senderId ?? raw.sender?.id;
    let senderName = "Unknown";

    if (raw.Sender) senderName = `${raw.Sender.firstName || ""} ${raw.Sender.lastName || ""}`.trim() || raw.Sender.email;
    else if (raw.sender) senderName = `${raw.sender.firstName || ""} ${raw.sender.lastName || ""}`.trim() || raw.sender.email;
    else {
      const found = users.find(u => u.id === senderId);
      if (found) senderName = getFullName(found);
      else if (senderId === uid) senderName = getFullName(user);
    }

    return {
      id: raw.id ?? `${senderId}-${raw.createdAt ?? Date.now()}`,
      chatRoomId: raw.chatRoomId,
      roomId: raw.roomId || currentRoomRef.current,
      senderId,
      senderName,
      text: raw.message ?? raw.text ?? "",
      mediaUrl: raw.mediaUrl ?? null,
      mediaType: raw.mediaType ?? null,
      originalName: raw.originalName ?? null,
      fileSize: raw.fileSize ?? null,
      replyTo: raw.replyTo ?? null,
      replyToMessage: raw.ReplyToMessage ?? raw.replyToMessage ?? null,
      timestamp: raw.createdAt ?? raw.timestamp ?? new Date().toISOString(),
      seen: raw.status === "seen" || raw.seen === true,
    };
  }, [users, user, getUserId]);

  // ── Socket Setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !user) { setLoading(false); setError("Not authenticated."); return; }

    const socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      autoConnect: false,
      path: "/socket.io",
      auth: { token },
      transportOptions: { polling: { extraHeaders: { token } } },
    });
    socketRef.current = socket;

    // ── Connection lifecycle
    socket.on("connect", () => {
      setConnectionStatus("connected");
      setError(null);
      // ✅ Correct: backend listens to "UserList" and "getMyGroups"
      socket.emit("UserList", { page: 1, limit: 100, search: "" });
      socket.emit("getMyGroups", { page: 1, limit: 100, search: "" });
      socket.emit("online", { userId: getUserId() });
    });
    socket.on("connect_error", () => { setConnectionStatus("error"); setLoading(false); });
    socket.on("disconnect", () => setConnectionStatus("disconnected"));

    // ── User list
    // ✅ Backend emits "UserList" with { success, total, totalPages, currentPage, data }
    socket.on("UserList", (res) => {
      if (!res?.success) { setError(res?.error || "Failed to load users"); setLoading(false); return; }
      setUsers((res.data || []).map(u => ({
        ...u,
        onlineStatus: u.onlineStatus ?? u.onlineSatus ?? "offline",
        unseenCount: u.unreadCount ?? u.Messages?.length ?? 0,
      })));
      setLoading(false);
    });

    // ── Group list
    // ✅ Backend listener is "getMyGroups"; backend emits back "getMyGroups"
    // ✅ Backend returns { success, total, totalPages, currentPage, data } where data are ChatRoom objects with groupName field and unreadCount
    socket.on("getMyGroups", (res) => {
      if (res?.success) setGroups(res.data || []);
      else if (res?.error) console.error("getMyGroups error:", res.error);
    });

    // ── Create Group
    // ✅ Backend emits "createGroup" back with { roomId, type, groupName, members } OR { error }
    socket.on("createGroup", (data) => {
      setIsCreatingGroup(false);
      if (data?.error) { setError(data.error); return; }
      // Add the new group directly to state (no re-fetch to avoid duplicates)
      if (data?.roomId) {
        setGroups(prev => {
          // Prevent duplicate if already exists
          if (prev.some(g => g.roomId === data.roomId)) return prev;
          return [{ roomId: data.roomId, type: "group", groupName: data.groupName }, ...prev];
        });
      }
      setShowCreateGroup(false);
      setNewGroupName("");
      setSelectedMembers([]);
      setCreateModalSearch("");
      // Switch to the newly created group
      // Backend returns: { roomId, type, groupName, members }
      if (data?.roomId) {
        setActiveChat({ roomId: data.roomId, type: "group", groupName: data.groupName });
      }
    });

    // ── Update Group Name
    // ✅ Backend listener: "updateGroupName"; emits back "updateGroupName" with { roomId, newName, updatedBy } OR { error }
    socket.on("updateGroupName", ({ error, roomId, newName }) => {
      if (error) { setError(error); return; }
      setGroups(p => p.map(g => g.roomId === roomId ? { ...g, groupName: newName } : g));
      setActiveChat(p => p?.roomId === roomId ? { ...p, groupName: newName } : p);
    });

    // ── Get Group Details (members list)
    // ✅ Backend listener: "getGroupDetails"; emits back "getGroupDetails" with { roomId, participants: [User] } OR { error }
    // participants are raw User objects (not wrapped in { User, isAdmin })
    socket.on("getGroupDetails", ({ error, roomId, participants }) => {
      if (error) { console.error("getGroupDetails error:", error); return; }
      setGroupMembers(participants || []);
    });

    // ── Add Group Members
    // ✅ Backend emits "addGroupMembers" with { roomId, addedMembers, addedBy } on success OR { error }
    // NOTE: No "success" field on the success path — presence of addedMembers indicates success
    socket.on("addGroupMembers", (data) => {
      if (data?.error) { setError(data.error); return; }
      // Success: data = { roomId, addedMembers, addedBy }
      setShowAddMembers(false);
      setSelectedNewMembers([]);
      setAddMemberSearch("");
      // Refresh members panel if we're viewing the same group
      if (currentRoomRef.current === data.roomId) {
        socket.emit("getGroupDetails", { roomId: data.roomId });
      }
    });

    // ── Leave Group / Member Removed
    // ✅ Backend emits "leaveGroup" for TWO scenarios:
    //    1. Current user left successfully: { roomId } (from socket.emit to self)
    //    2. A member was kicked: { roomId, removedMember, removedBy } (broadcast to room)
    socket.on("leaveGroup", (data) => {
      if (data?.error) { setError(data.error); return; }
      if (data?.removedMember) {
        // Someone was removed — update members list if panel is open
        setGroupMembers(p => p.filter(m => (m.id ?? m.userId) !== data.removedMember));
      } else if (data?.roomId) {
        // Current user left the group — close the chat and remove from list
        setGroups(p => p.filter(g => g.roomId !== data.roomId));
        setActiveChat(p => p?.roomId === data.roomId ? null : p);
      }
    });

    // ── Group Deleted
    // ✅ Backend emits "groupDeleted" with { roomId, message, deletedBy } to all members
    socket.on("groupDeleted", (data) => {
      if (data?.error) { setError(data.error); return; }
      if (data?.roomId) {
        setGroups(p => p.filter(g => g.roomId !== data.roomId));
        setActiveChat(p => p?.roomId === data.roomId ? null : p);
        if (data.message) {
          addNotification({
            senderName: "System",
            text: data.message,
            roomId: data.roomId,
          });
        }
      }
    });

    // ── Member Left (someone left voluntarily — broadcast to others)
    // ✅ Backend emits "memberLeft" with { roomId, leftMember } when a user leaves
    socket.on("memberLeft", ({ leftMember }) => {
      setGroupMembers(p => p.filter(m => (m.id ?? m.userId) !== leftMember));
    });

    // ── Messages
    // ✅ Backend emits "mychats" with { success, total, totalPages, currentPage, data }
    socket.on("mychats", (res) => {
      if (!res?.success) return;
      const rows = Array.isArray(res?.data) ? res.data : [];
      const uid = getUserId();
      const fmt = rows.map(formatMessage).reverse();

      // Update pagination tracking
      currentPageRef.current = res.currentPage;
      totalPagesRef.current = res.totalPages;
      setCurrentPage(res.currentPage);
      setTotalPages(res.totalPages);
      setHasMore(res.currentPage < res.totalPages);

      if (res.currentPage === 1) {
        setMessages(fmt);
      } else {
        // Prepend older messages
        setMessages(prev => [...fmt, ...prev]);
      }

      fmt.forEach(m => {
        if (!m.seen && m.senderId !== uid) {
          socket.emit("seenMessage", { msg_id: m.id, roomId: currentRoomRef.current });
        }
      });
    });

    // ✅ Backend emits "receiveMessage" with the raw Message object directly (NOT wrapped in { data })
    socket.on("receiveMessage", (raw) => {
      const msg = formatMessage(raw);
      const uid = getUserId();

      if (msg.roomId && msg.roomId !== currentRoomRef.current) {
        // Message for a different chat — show notification + increment unread
        setUnreadCounts(prev => ({
          ...prev,
          [msg.roomId]: (prev[msg.roomId] || 0) + 1,
        }));
        addNotification({
          senderName: msg.senderName,
          text: msg.text || (msg.mediaUrl ? "📎 Sent a file" : ""),
          roomId: msg.roomId,
        });
        socket.emit("UserList", { page: 1, limit: 100, search: "" });
        // Also refresh groups in case user was added to a new group
        socket.emit("getMyGroups", { page: 1, limit: 100, search: "" });
        return;
      }
      if (msg.senderId !== uid) {
        socket.emit("seenMessage", { msg_id: msg.id, roomId: currentRoomRef.current });
      }
      setMessages(prev => {
        const dup = prev.some(m =>
          m.id === msg.id ||
          (m.text === msg.text && m.senderId === msg.senderId &&
            Math.abs(new Date(m.timestamp) - new Date(msg.timestamp)) < 2000)
        );
        return dup ? prev : [...prev, msg];
      });
    });

    // ✅ Backend emits "seenMessage" with { success, data: updatedCount, msg_id, seenBy }
    socket.on("seenMessage", (data) => {
      if (!data?.success) return;
      if (data.msg_id) {
        // Use String() for safe matching across Integer/UUID/String
        setMessages(p => p.map(m => String(m.id) === String(data.msg_id) ? { ...m, seen: true } : m));
      } else {
        // Fallback: If no msg_id was provided, assume the other user just read all of OUR messages.
        // Therefore, we mark OUR messages (senderId === uid) as seen.
        setMessages(p => p.map(m => m.senderId === getUserId() ? { ...m, seen: true } : m));
      }
    });

    // ✅ Backend emits "Deleted" with { id }
    socket.on("Deleted", ({ id }) => {
      if (id) setMessages(p => p.filter(m => m.id !== id));
    });

    // ✅ Backend emits "onlineUser" with { success, data: "online" | "offline" }
    // NOTE: backend does NOT include userId in this event — generic broadcast only
    socket.on("onlineUser", (res) => {
      // Since the backend doesn't return which userId is online/offline,
      // we can only use this as a trigger to refresh the user list for badges
      if (res?.success) {
        socket.emit("UserList", { page: 1, limit: 100, search: "" });
      }
    });

    // ✅ Backend emits "typing" with the same data that was sent by client
    socket.on("typing", ({ roomId, userId: uid, isTyping }) => {
      if (roomId !== currentRoomRef.current || uid === getUserId()) return;
      if (!isTyping) { setTypingUser(null); return; }
      const found = users.find(u => u.id === uid);
      setTypingUser(found ? getFullName(found) : "Someone");
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000);
    });

    // ✅ Backend emits "errorMessage" with { error }
    socket.on("errorMessage", ({ error: msg }) => setError(msg));

    // ✅ Backend emits "roomJoined" with { roomId, type } — optional: use for confirmation
    socket.on("roomJoined", ({ roomId }) => {
      console.log("Joined room:", roomId);
    });

    socket.connect();

    return () => {
      clearTimeout(typingTimerRef.current);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Search users ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("UserList", { page: 1, limit: 100, search: searchQuery });
        socketRef.current.emit("getMyGroups", { page: 1, limit: 100, search: searchQuery });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Switch active chat ────────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeChat || !user) return;

    const grp = activeChat.type === "group";
    const roomId = grp
      ? activeChat.roomId
      : buildRoomId(getUserId(), activeChat.id);

    setMessages([]);
    setTypingUser(null);
    setReplyTo(null);
    setPendingFile(null);
    setUploadError(null);
    setUploadProgress(0);
    setCurrentRoom(roomId);
    currentRoomRef.current = roomId;
    setShowGroupMenu(false);
    setEditNameMode(false);
    setShowMembersPanel(false);
    setGroupMembers([]);

    // Reset pagination
    setCurrentPage(1);
    currentPageRef.current = 1;
    setTotalPages(1);
    totalPagesRef.current = 1;
    setHasMore(false);
    setIsLoadingMore(false);
    isLoadingMoreRef.current = false;

    // Clear unread count for this room
    clearUnreadCount(roomId);

    // ✅ Backend "joinRoom" listener expects { roomId, type, members }
    socket.emit("joinRoom", {
      roomId,
      type: grp ? "group" : "private",
      members: [],
    });

    setTimeout(() => {
      socket.emit("mychats", { roomId, page: 1 });
    }, 150);

    // ✅ Backend "getGroupDetails" listener expects { roomId }
    if (grp) {
      socket.emit("getGroupDetails", { roomId });
    }
  }, [activeChat]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── File upload via XHR (progress tracking) ───────────────────────────────
  const uploadFile = (file) => new Promise((resolve, reject) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/chat/upload`);
    xhr.setRequestHeader("token", token);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          data.success ? resolve(data) : (setUploadError(data.error || "Upload failed"), reject(data.error));
        } catch { setUploadError("Invalid server response"); reject("parse error"); }
      } else {
        setUploadError(`Upload failed (${xhr.status})`); reject(xhr.status);
      }
    };
    xhr.onerror = () => { setIsUploading(false); setUploadError("Network error during upload"); reject("network"); };

    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) { setUploadError(`File exceeds ${MAX_FILE_MB} MB`); return; }
    setUploadError(null);
    setPendingFile(file);
    setShowAttachMenu(false);
    e.target.value = "";
  };

  // ── Send message ──────────────────────────────────────────────────────────
  // ✅ Backend "sendMessage" expects { roomId, message }
  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = messageText.trim();
    const socket = socketRef.current;
    if (!activeChat || !socket?.connected) { socket?.connect(); return; }
    if (!text && !pendingFile) return;

    try {
      let extra = {};
      if (pendingFile) {
        const result = await uploadFile(pendingFile);
        extra = {
          mediaUrl: result.mediaUrl,
          mediaType: result.mediaType,
          originalName: result.originalName,
          fileSize: result.size,
        };
        setPendingFile(null);
        setUploadProgress(0);
      }

      socket.emit("sendMessage", {
        roomId: currentRoomRef.current,
        message: text || null,
        ...(replyTo?.id ? { replyTo: replyTo.id } : {}),
        ...extra,
      });

      setMessageText("");
      setReplyTo(null);
      textareaRef.current?.focus();
    } catch { /* uploadError already set */ }
  };

  // ── Typing indicator ──────────────────────────────────────────────────────
  const handleTyping = () => {
    const socket = socketRef.current;
    if (!socket || !currentRoomRef.current) return;
    socket.emit("typing", { roomId: currentRoomRef.current, userId: getUserId(), isTyping: true });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() =>
      socket.emit("typing", { roomId: currentRoomRef.current, userId: getUserId(), isTyping: false }), 1500);
  };

  // ── Message actions ───────────────────────────────────────────────────────
  // ✅ Backend "messageToDelete" expects { id, senderId }
  const deleteMessage = (msg) => {
    socketRef.current?.emit("messageToDelete", { id: msg.id, senderId: msg.senderId });
    setContextMenu(null);
  };

  // ── Group actions ─────────────────────────────────────────────────────────
  // ✅ Backend "createGroup" expects { members, name }
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const createGroup = () => {
    if (!newGroupName.trim() || !selectedMembers.length || isCreatingGroup) return;
    setIsCreatingGroup(true);
    socketRef.current?.emit("createGroup", { name: newGroupName.trim(), members: selectedMembers });
    // Reset after short delay as safety net
    setTimeout(() => setIsCreatingGroup(false), 2000);
  };

  // ✅ Backend "updateGroupName" expects { roomId, newName } (NOT "editGroupName")
  const renameGroup = () => {
    if (!editNameValue.trim()) return;
    socketRef.current?.emit("updateGroupName", { roomId: activeChat.roomId, newName: editNameValue.trim() });
    setEditNameMode(false);
  };

  // ✅ Backend "leaveGroup" expects { roomId }
  const leaveGroup = () => {
    if (!window.confirm("Leave this group?")) return;
    socketRef.current?.emit("leaveGroup", { roomId: activeChat.roomId });
  };

  // ✅ Backend "deleteGroup" expects { roomId }
  const deleteGroup = () => {
    if (!window.confirm("Are you sure you want to completely delete this group for everyone? This action cannot be undone.")) return;
    socketRef.current?.emit("deleteGroup", { roomId: activeChat.roomId });
    setShowGroupMenu(false);
  };

  // ✅ Backend "getGroupDetails" expects { roomId } — opens members panel
  const openMembers = () => {
    setShowMembersPanel(true);
    setShowGroupMenu(false);
    socketRef.current?.emit("getGroupDetails", { roomId: activeChat.roomId });
  };

  // ✅ Backend "removeGroupMember" expects { roomId, memberIdToRemove } (NOT memberId)
  const removeMember = (id) => {
    if (!window.confirm("Remove this member?")) return;
    socketRef.current?.emit("removeGroupMember", { roomId: activeChat.roomId, memberIdToRemove: id });
  };

  // ✅ Backend "addGroupMembers" expects { roomId, newMembers } (NOT members)
  const addMembers = () => {
    if (!selectedNewMembers.length) return;
    socketRef.current?.emit("addGroupMembers", { roomId: activeChat.roomId, newMembers: selectedNewMembers });
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    getFullName(u).toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ Groups use "groupName" field (backend ChatRoom model field name)
  const filteredGroups = groups.filter(g =>
    (g.groupName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isGroup = activeChat?.type === "group";
  // ✅ groupMembers are raw User objects from getGroupDetails (participants array)
  const existingIds = groupMembers.map(m => m.id ?? m.userId);
  const addableUsers = users.filter(u =>
    !existingIds.includes(u.id) &&
    (getFullName(u).toLowerCase().includes(addMemberSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(addMemberSearch.toLowerCase()))
  );

  const forwardTargets = [
    ...filteredGroups.map(g => ({ roomId: g.roomId, label: g.groupName, isGroup: true })),
    ...filteredUsers.map(u => {
      const a = getUserId(), b = u.id;
      return { roomId: a < b ? `${a}-${b}` : `${b}-${a}`, label: getFullName(u), isGroup: false };
    }),
  ].filter(t =>
    t.roomId !== currentRoom &&
    (t.label ?? "").toLowerCase().includes(forwardSearch.toLowerCase())
  );

  // ✅ Backend "forwardMessage" — emit if you add it later
  const handleForward = (rid) => {
    socketRef.current?.emit("forwardMessage", { messageId: forwardMsg.id, toRoomId: rid });
    setForwardMsg(null);
  };

  const canSend = !!(messageText.trim() || pendingFile) && !isUploading && connectionStatus === "connected";

  if (!user) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white relative"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*,video/*"
        className="hidden" onChange={handleFileSelect} />
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,audio/*"
        className="hidden" onChange={handleFileSelect} />

      {/* ══ CREATE GROUP MODAL ════════════════════════════════════════════════ */}
      {showCreateGroup && (
        <Modal title="New Group" onClose={() => setShowCreateGroup(false)}
          footer={<>
            <div onClick={() => setShowCreateGroup(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
              Cancel
            </div>
            <div onClick={createGroup}
              className={`px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl transition-colors cursor-pointer
                ${!newGroupName.trim() || !selectedMembers.length ? "opacity-40 pointer-events-none" : "hover:bg-blue-700"}`}>
              Create
            </div>
          </>}>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Group Name</label>
            <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
              placeholder="e.g. Design Team" autoFocus
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Add Members</label>
            <SearchInput value={createModalSearch} onChange={setCreateModalSearch} placeholder="Search people…" />
          </div>
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedMembers.map(id => {
                const u = users.find(x => x.id === id);
                return (
                  <span key={id} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {getFullName(u)}
                    <div onClick={() => setSelectedMembers(p => p.filter(m => m !== id))}
                      className="cursor-pointer hover:text-red-500 ml-0.5"><IoClose size={13} /></div>
                  </span>
                );
              })}
            </div>
          )}
          <div className="max-h-52 overflow-y-auto space-y-0.5 -mx-1">
            {users
              .filter(u => getFullName(u).toLowerCase().includes(createModalSearch.toLowerCase()))
              .map(u => {
                const sel = selectedMembers.includes(u.id);
                return (
                  <div key={u.id}
                    onClick={() => setSelectedMembers(p => sel ? p.filter(id => id !== u.id) : [...p, u.id])}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${sel ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${sel ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                      {sel && <IoCheckmark size={12} className="text-white" />}
                    </div>
                    <Avatar entity={u} size={8} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{getFullName(u)}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </Modal>
      )}

      {/* ══ FORWARD MODAL ════════════════════════════════════════════════════ */}
      {forwardMsg && (
        <Modal title="Forward Message" onClose={() => setForwardMsg(null)}>
          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 italic border border-gray-100 truncate">
            {forwardMsg.mediaUrl ? `📎 ${forwardMsg.originalName || "File"}` : `"${forwardMsg.text}"`}
          </div>
          <SearchInput value={forwardSearch} onChange={setForwardSearch} placeholder="Search conversations…" />
          <div className="max-h-64 overflow-y-auto space-y-0.5 -mx-1">
            {forwardTargets.map(t => (
              <div key={t.roomId} onClick={() => handleForward(t.roomId)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors group">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0
                  ${t.isGroup ? "bg-gradient-to-br from-violet-500 to-fuchsia-600" : "bg-gradient-to-br from-sky-500 to-blue-600"}`}>
                  {t.isGroup ? <HiUserGroup size={16} /> : (t.label?.[0] ?? "?").toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 flex-1 truncate">{t.label ?? "Unnamed"}</span>
                <IoArrowForward size={16} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
            {!forwardTargets.length && <p className="text-center text-sm text-gray-400 py-6">No conversations found.</p>}
          </div>
        </Modal>
      )}

      {/* ══ ADD MEMBERS MODAL ════════════════════════════════════════════════ */}
      {showAddMembers && (
        <Modal title="Add Members"
          onClose={() => { setShowAddMembers(false); setSelectedNewMembers([]); }}
          footer={<>
            <div onClick={() => { setShowAddMembers(false); setSelectedNewMembers([]); }}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors">
              Cancel
            </div>
            <div onClick={addMembers}
              className={`px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl cursor-pointer transition-colors
                ${!selectedNewMembers.length ? "opacity-40 pointer-events-none" : "hover:bg-blue-700"}`}>
              Add {selectedNewMembers.length > 0 ? `(${selectedNewMembers.length})` : ""}
            </div>
          </>}>
          <SearchInput value={addMemberSearch} onChange={setAddMemberSearch} placeholder="Search users…" />
          {selectedNewMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedNewMembers.map(id => {
                const u = users.find(x => x.id === id);
                return (
                  <span key={id} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {getFullName(u)}
                    <div onClick={() => setSelectedNewMembers(p => p.filter(m => m !== id))}
                      className="cursor-pointer"><IoClose size={13} /></div>
                  </span>
                );
              })}
            </div>
          )}
          <div className="max-h-64 overflow-y-auto space-y-0.5 -mx-1">
            {addableUsers.map(u => {
              const sel = selectedNewMembers.includes(u.id);
              return (
                <div key={u.id}
                  onClick={() => setSelectedNewMembers(p => sel ? p.filter(id => id !== u.id) : [...p, u.id])}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${sel ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${sel ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                    {sel && <IoCheckmark size={12} className="text-white" />}
                  </div>
                  <Avatar entity={u} size={8} />
                  <p className="text-sm font-semibold text-gray-800 truncate flex-1">{getFullName(u)}</p>
                </div>
              );
            })}
            {!addableUsers.length && <p className="text-center text-sm text-gray-400 py-4">No users to add.</p>}
          </div>
        </Modal>
      )}

      {/* ══ CONTEXT MENU ════════════════════════════════════════════════════ */}
      {contextMenu && (
        <div ref={menuRef}
          style={{ top: contextMenu.y, left: contextMenu.x, position: "fixed", zIndex: 9999 }}
          className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[160px] py-1">
          <MenuItem
            icon={<IoArrowUndo size={15} className="text-gray-400" />}
            label="Reply"
            onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null); textareaRef.current?.focus(); }} />
          <MenuItem
            icon={<IoArrowForward size={15} className="text-gray-400" />}
            label="Forward"
            onClick={() => { setForwardMsg(contextMenu.msg); setContextMenu(null); }} />
          {contextMenu.msg.senderId === getUserId() && (
            <MenuItem
              icon={<IoTrash size={15} />}
              label="Delete"
              variant="danger"
              onClick={() => deleteMessage(contextMenu.msg)} />
          )}
        </div>
      )}

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <div className={`${sidebarCollapsed ? "w-[72px]" : "w-72"} flex flex-col border-r border-gray-100 transition-all duration-300 flex-shrink-0 bg-gray-50`}>
        <div className="px-4 py-4 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            {!sidebarCollapsed && <h2 className="text-base font-bold text-gray-900 tracking-tight">Messages</h2>}
            <div className="flex items-center gap-2 ml-auto">
              <div className={`w-2 h-2 rounded-full flex-shrink-0
                ${connectionStatus === "connected" ? "bg-emerald-400"
                  : connectionStatus === "error" ? "bg-red-400"
                    : "bg-amber-400 animate-pulse"}`}
                title={connectionStatus} />
              {!sidebarCollapsed && (
                <div onClick={() => setShowCreateGroup(true)}
                  className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all cursor-pointer">
                  <IoAdd size={17} />
                </div>
              )}
            </div>
          </div>
          {!sidebarCollapsed && <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search…" />}
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loading
            ? <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>
            : (<>
              {/* Groups — use groupName field from backend */}
              {filteredGroups.length > 0 && (
                <div>
                  {!sidebarCollapsed && (
                    <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Groups</p>
                  )}
                  {filteredGroups.map(g => {
                    const active = activeChat?.roomId === g.roomId && activeChat?.type === "group";
                    return (
                      <div key={g.id ?? g.roomId}
                        onClick={() => setActiveChat({ ...g, type: "group" })}
                        title={sidebarCollapsed ? g.groupName : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 mx-1.5 rounded-xl transition-all cursor-pointer
                          ${active ? "bg-violet-50" : "hover:bg-gray-100"}`}
                        style={{ width: "calc(100% - 12px)" }}>
                        <Avatar entity={{ ...g, type: "group" }} size={10} />
                        {!sidebarCollapsed && (
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                            <span className={`text-sm font-semibold truncate ${active ? "text-violet-900" : "text-gray-800"}`}>
                              {g.groupName || "Unnamed Group"}
                            </span>
                            {(() => {
                              const count = (unreadCounts[g.roomId] || 0) + (g.unreadCount || 0);
                              return count > 0 ? (
                                <span className="flex-shrink-0 ml-1 bg-violet-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center animate-pulse">
                                  {count > 99 ? "99+" : count}
                                </span>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Direct Messages */}
              {filteredUsers.length > 0 && (
                <div>
                  {!sidebarCollapsed && (
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Direct</p>
                  )}
                  {filteredUsers.map(u => {
                    const active = activeChat?.id === u.id && activeChat?.type !== "group";
                    return (
                      <div key={u.id}
                        onClick={() => setActiveChat(u)}
                        title={sidebarCollapsed ? getFullName(u) : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 mx-1.5 rounded-xl transition-all cursor-pointer
                          ${active ? "bg-blue-50" : "hover:bg-gray-100"}`}
                        style={{ width: "calc(100% - 12px)" }}>
                        <Avatar entity={u} size={10} />
                        {!sidebarCollapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-semibold truncate ${active ? "text-blue-900" : "text-gray-800"}`}>{getFullName(u)}</span>
                              {(() => {
                                const rid = buildRoomId(getUserId(), u.id);
                                const count = (unreadCounts[rid] || 0) + (u.unseenCount || 0);
                                return count > 0 ? (
                                  <span className="flex-shrink-0 ml-1 bg-blue-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center animate-pulse">
                                    {count > 99 ? "99+" : count}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {!filteredGroups.length && !filteredUsers.length && (
                <p className="text-center text-sm text-gray-400 py-10">No conversations found.</p>
              )}
            </>)}
        </div>

        {/* Current user footer */}
        <div className="px-3 py-3 border-t border-gray-100 bg-white flex-shrink-0">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center" : ""}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user)}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{getFullName(user)}</p>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{user.role}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar collapse toggle */}
      <div onClick={() => setSidebarCollapsed(p => !p)}
        className="absolute top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:shadow-lg z-30 transition-all cursor-pointer"
        style={{ left: sidebarCollapsed ? "calc(72px - 13px)" : "calc(288px - 13px)" }}>
        {sidebarCollapsed
          ? <IoChevronForward size={14} className="text-gray-500" />
          : <IoChevronBack size={14} className="text-gray-500" />}
      </div>

      {/* ══ CHAT AREA ════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-[#efeae2]">
          {activeChat ? (<>

            {/* Chat Header */}
            <div className="px-6 py-2.5 border-b border-gray-200 bg-[#f0f2f5] flex items-center justify-between flex-shrink-0 z-20">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar entity={activeChat} size={11} />
                <div className="min-w-0">
                  {editNameMode && isGroup ? (
                    <div className="flex items-center gap-2">
                      <input value={editNameValue}
                        onChange={e => setEditNameValue(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && renameGroup()}
                        autoFocus
                        className="border border-blue-300 rounded-lg px-2.5 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300" />
                      <div onClick={renameGroup}
                        className="text-white bg-emerald-500 hover:bg-emerald-600 p-1 rounded-lg cursor-pointer">
                        <IoCheckmark size={14} />
                      </div>
                      <div onClick={() => setEditNameMode(false)}
                        className="text-white bg-gray-400 hover:bg-gray-500 p-1 rounded-lg cursor-pointer">
                        <IoClose size={14} />
                      </div>
                    </div>
                  ) : (
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {/* ✅ Use groupName for groups */}
                      {isGroup ? (activeChat.groupName || "Group") : getFullName(activeChat)}
                    </h3>
                  )}
                  <p className="text-xs text-gray-400 truncate">
                    {isGroup
                      ? (groupMembers.length > 0 ? `${groupMembers.length} members` : "Group")
                      : activeChat.onlineStatus === "online"
                        ? <span className="text-emerald-500 font-medium">Active now</span>
                        : "Offline"}
                  </p>
                </div>
              </div>

              {isGroup && (
                <div className="relative" ref={menuRef}>
                  <div onClick={() => setShowGroupMenu(p => !p)}
                    className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">
                    <IoEllipsisVertical size={19} />
                  </div>
                  {showGroupMenu && (
                    <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 py-1">
                      <MenuItem icon={<IoPeople size={15} className="text-gray-400" />} label="View Members" onClick={openMembers} />
                      <MenuItem icon={<IoPersonAdd size={15} className="text-gray-400" />} label="Add Members"
                        onClick={() => { setShowAddMembers(true); setShowGroupMenu(false); }} />
                      <MenuItem icon={<IoPencil size={15} className="text-gray-400" />} label="Edit Name"
                        onClick={() => {
                          // ✅ Seed with groupName (backend field)
                          setEditNameMode(true);
                          setEditNameValue(activeChat.groupName || "");
                          setShowGroupMenu(false);
                        }} />
                      <div className="border-t border-gray-100 my-1" />
                      <MenuItem icon={<IoExit size={15} />} label="Leave Group" variant="warning"
                        onClick={() => { leaveGroup(); setShowGroupMenu(false); }} />
                      <MenuItem icon={<IoTrash size={15} />} label="Delete Group" variant="danger"
                        onClick={deleteGroup} />
                      <div className="border-t border-gray-100 my-1" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto px-[5%] py-4 flex flex-col"
              ref={chatContainerRef}
              onScroll={handleScrollUp}
              onClick={() => setShowGroupMenu(false)}>

              {/* Loading older messages indicator */}
              {isLoadingMore && (
                <div className="flex justify-center py-3">
                  <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-4 py-2 shadow-sm">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-500 font-medium">Loading older messages…</span>
                  </div>
                </div>
              )}

              {/* Scroll up hint */}
              {hasMore && !isLoadingMore && messages.length > 0 && (
                <div className="flex justify-center py-2">
                  <span className="text-[11px] text-gray-400 font-medium">↑ Scroll up for older messages</span>
                </div>
              )}
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center">
                  <div className="w-20 h-20 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4">
                    {isGroup
                      ? <HiUserGroup className="w-10 h-10 text-gray-300" />
                      : <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>}
                  </div>
                  <p className="text-base font-bold text-gray-700">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">Say hello 👋</p>
                </div>
              ) : (<>
                {/* Spacer pushes messages to bottom like WhatsApp */}
                <div className="flex-1" />
                <div className="space-y-1">
                  {messages.map((msg, idx) => {
                    const own = msg.senderId === getUserId();
                    const showDate = idx === 0 ||
                      new Date(msg.timestamp) - new Date(messages[idx - 1].timestamp) > 300000;

                    return (
                      <div key={msg.id || idx}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="text-[11.5px] font-medium text-gray-600 bg-[#E1F2FB] px-3 py-1 rounded-md shadow-sm">
                              {dateStr(msg.timestamp)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${own ? "justify-end" : "justify-start"} group mb-1`}>

                          {/* Hover action buttons */}
                          <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity
                          ${own ? "order-first mr-1.5" : "order-last ml-1.5"}`}>
                            <div
                              onClick={() => { setReplyTo(msg); textareaRef.current?.focus(); }}
                              className="p-1.5 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-500 cursor-pointer"
                              title="Reply">
                              <IoArrowUndo size={13} />
                            </div>
                            <div
                              onClick={() => setForwardMsg(msg)}
                              className="p-1.5 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-500 cursor-pointer"
                              title="Forward">
                              <IoArrowForward size={13} />
                            </div>
                            {own && (
                              <div
                                onClick={() => deleteMessage(msg)}
                                className="p-1.5 rounded-full bg-white border border-red-100 shadow-sm hover:bg-red-50 text-red-400 cursor-pointer"
                                title="Delete">
                                <IoTrash size={13} />
                              </div>
                            )}
                          </div>

                          {/* Message bubble */}
                          <div
                            className={`relative max-w-[75%] px-3 py-1.5 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]
                            ${own
                                ? "bg-[#d9fdd3] text-[#111b21] rounded-lg rounded-tr-[0px]"
                                : "bg-white text-[#111b21] rounded-lg rounded-tl-[0px]"}`}
                            onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, msg }); }}>

                            {/* Sender name in group chats */}
                            {!own && isGroup && (
                              <p className="text-[12px] font-bold text-violet-500 mb-0.5 tracking-wide cursor-pointer hover:underline">
                                {msg.senderName}
                              </p>
                            )}

                            {/* Reply preview */}
                            {msg.replyToMessage && (
                              <div className="text-xs rounded-md px-2.5 py-1.5 mb-1.5 border-l-4 bg-black/5 border-violet-500 cursor-pointer">
                                <p className="font-bold mb-0.5 text-violet-600">
                                  {msg.replyToMessage.senderId === getUserId() ? "You" : msg.replyToMessage.senderName || msg.senderName}
                                </p>
                                <p className="truncate text-gray-600">
                                  {msg.replyToMessage.message || msg.replyToMessage.text || "📎 File"}
                                </p>
                              </div>
                            )}

                            {/* Media content */}
                            {msg.mediaUrl && <MediaBubble msg={msg} own={own} />}

                            {/* Text content & Time inline wrapper */}
                            <div className="relative inline-block w-full">
                              {msg.text && (
                                <p className="text-[14.5px] leading-snug break-words whitespace-pre-wrap m-0">
                                  {msg.text}
                                  {/* Dummy spacing to prevent timestamp overlap */}
                                  <span className="inline-block w-[70px] h-2 bg-transparent" />
                                </p>
                              )}

                              {/* Time + seen status */}
                              <div className={`flex items-center gap-[3px] select-none text-gray-500 ${msg.text ? "absolute bottom-[-2px] right-0" : "justify-end mt-1"}`}>
                                <span className="text-[10px] font-medium leading-none mt-[2px]">
                                  {timeStr(msg.timestamp)}
                                </span>
                                {own && (
                                  msg.seen
                                    ? <IoCheckmarkDone size={15} className="text-[#53bdeb]" />
                                    : <IoCheckmark size={15} className="text-[#8696a0]" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Typing indicator */}
                {typingUser && (
                  <div className="flex justify-start mt-1">
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0, 150, 300].map(d => (
                          <span key={d} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{typingUser} is typing…</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>)}
            </div>

            {/* Reply bar */}
            {replyTo && (
              <div className="px-5 py-2.5 bg-blue-50 border-t border-blue-100 flex items-center gap-3 flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-600 mb-0.5">
                    Replying to {replyTo.senderName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {replyTo.mediaUrl ? `📎 ${replyTo.originalName || "File"}` : replyTo.text}
                  </p>
                </div>
                <div onClick={() => setReplyTo(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-blue-100 transition-colors flex-shrink-0 cursor-pointer">
                  <IoClose size={16} />
                </div>
              </div>
            )}

            {/* ── INPUT AREA ──────────────────────────────────────────────── */}
            <div className="px-5 py-3 bg-[#f0f2f5] flex-shrink-0 z-20 w-full">

              {/* File preview */}
              {pendingFile && (
                <div className="mb-3">
                  <FilePreview file={pendingFile} onRemove={() => {
                    setPendingFile(null); setUploadError(null); setUploadProgress(0);
                  }} />
                </div>
              )}

              {/* Upload progress */}
              {isUploading && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1.5">
                      <IoCloudUpload size={13} />Uploading…
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Upload error */}
              {uploadError && (
                <p className="text-xs text-red-500 font-medium mb-2.5 flex items-center gap-1.5">
                  ⚠️ {uploadError}
                  <span onClick={() => setUploadError(null)}
                    className="cursor-pointer underline hover:text-red-700 ml-1">
                    Dismiss
                  </span>
                </p>
              )}

              <div className="flex items-end gap-2.5 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2
                focus-within:ring-2 focus-within:ring-blue-400/40 focus-within:border-blue-300 transition-all">

                {/* Attach button */}
                <div className="relative flex-shrink-0 self-end pb-1" ref={attachMenuRef}>
                  <div onClick={() => setShowAttachMenu(p => !p)} title="Attach"
                    className={`p-2 rounded-xl transition-all cursor-pointer
                      ${showAttachMenu ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"}`}>
                    <IoAttach size={20} />
                  </div>
                  {showAttachMenu && (
                    <div className="absolute bottom-full mb-2 left-0 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 w-48 z-20 overflow-hidden">
                      <div onClick={() => imageInputRef.current?.click()}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 cursor-pointer transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <IoImage size={15} className="text-purple-600" />
                        </div>
                        <span className="font-medium">Photo / Video</span>
                      </div>
                      <div onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <IoDocument size={15} className="text-blue-600" />
                        </div>
                        <span className="font-medium">Document / File</span>
                      </div>
                      <div className="px-4 pt-0.5 pb-1.5">
                        <p className="text-[10px] text-gray-400">Max {MAX_FILE_MB} MB</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Text input */}
                <textarea ref={textareaRef} rows={1} value={messageText}
                  onChange={e => { setMessageText(e.target.value); handleTyping(); }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder={
                    isUploading ? "Uploading…"
                      : pendingFile ? "Add a caption… (optional)"
                        : connectionStatus === "connected" ? "Type a message…"
                          : "Reconnecting…"
                  }
                  disabled={connectionStatus !== "connected" || isUploading}
                  className="flex-1 bg-transparent text-sm resize-none focus:outline-none max-h-28 py-2 placeholder-gray-400" />

                {/* Send button */}
                <div onClick={canSend ? sendMessage : undefined}
                  className={`p-2.5 rounded-xl transition-all shadow-sm flex-shrink-0 self-end mb-0.5
                    ${canSend
                      ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md cursor-pointer"
                      : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
                  {isUploading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <IoSend size={17} className="ml-0.5" />}
                </div>
              </div>

              {connectionStatus !== "connected" && (
                <p className="text-xs text-red-500 font-medium mt-1.5 px-1 animate-pulse">
                  {connectionStatus === "error" ? "⚠️ Connection failed" : "🔄 Reconnecting…"}
                </p>
              )}
            </div>

          </>) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center flex-1 bg-gray-50/30">
              <div className="w-24 h-24 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-5">
                <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Your Messages</h3>
              <p className="text-sm text-gray-400 text-center max-w-xs leading-relaxed">Select a conversation or start a new group.</p>
            </div>
          )}
        </div>

        {/* ── Members Side Panel ─────────────────────────────────────────── */}
        {showMembersPanel && isGroup && (
          <div className="w-64 border-l border-gray-100 flex flex-col bg-white flex-shrink-0">
            <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h4 className="text-sm font-bold text-gray-800">Members</h4>
              <div className="flex items-center gap-1">
                <div onClick={() => { setShowAddMembers(true); setShowMembersPanel(false); }}
                  className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                  title="Add">
                  <IoPersonAdd size={15} />
                </div>
                <div onClick={() => setShowMembersPanel(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <IoClose size={16} />
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {groupMembers.length === 0
                ? <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
                // ✅ participants from getGroupDetails are raw User objects (id, firstName, lastName, email, role)
                : groupMembers.map(member => {
                  const mid = member.id ?? member.userId;
                  return (
                    <div key={mid} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 rounded-xl mx-1.5 group">
                      <Avatar entity={member} size={9} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{getFullName(member)}</p>
                        <p className="text-[10px] text-gray-400 truncate">{member.role}</p>
                      </div>
                      {mid !== getUserId() && (
                        <div onClick={() => removeMember(mid)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Remove">
                          <IoPersonRemove size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* ══ NOTIFICATION TOASTS ═══════════════════════════════════════════════ */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2">
          {notifications.map(n => (
            <NotificationToast key={n.id} notification={n} onDismiss={dismissNotification} />
          ))}
        </div>
      )}

      {/* Notification slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}