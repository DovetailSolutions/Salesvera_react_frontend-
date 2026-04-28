// UserChat.jsx — Fully synced with backend socket events & Complete UI
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
import { useNotifications } from "../utils/NotificationContext";


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

function Avatar({ entity, size = 11, header = false }) {
  const isGroup = entity?.type === "group";
  const online = entity?.onlineStatus === "online" || entity?.onlineSatus === "online";
  const sz = `w-${size} h-${size}`;
  const bgClass = header
    ? (isGroup
      ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white"
      : "bg-gradient-to-r text-white from-[#5A77FF] to-[#A052FF]")
    : "dark:bg-[#333541] bg-gray-200";
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} rounded-full flex items-center justify-center font-semibold text-sm shadow-sm ${bgClass}`}>
        {isGroup ? <HiUserGroup size={size * 1.5} /> : getInitials(entity)}
      </div>
      {!isGroup && online && !header && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full custom-border border-[#161821]" />
      )}
    </div>
  );
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="translucent-background rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[88vh]custom-borderborder-white/5"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-bold text">{title}</h3>
          <div onClick={onClose} className="text-gray-400 hover:text p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
            <IoClose size={20} />
          </div>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-4">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-white/5 bg-white/5 rounded-b-2xl flex justify-end gap-2 flex-shrink-0">
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
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 dark:bg-[#1C1E2A] bg-gray-100 text placeholder-gray-500custom-borderborder-white/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#5A77FF] transition-all"
      />
    </div>
  );
}

function MenuItem({ icon, label, onClick, variant = "default" }) {
  const colors = {
    default: "text-gray-300 hover:bg-[#2A2D3A] hover:text",
    danger: "text-red-400 hover:bg-red-500/10",
    warning: "text-orange-400 hover:bg-orange-500/10",
  };
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${colors[variant]}`}
    >
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
    <div
      className="flex items-center gap-3 translucent-background rounded-2xl shadow-2xlcustom-borderborder-white/10 px-4 py-3 min-w-[280px] max-w-sm cursor-pointer hover:bg-white/5 transition-colors"
      style={{ animation: "slideInRight 0.3s ease-out" }}
      onClick={() => onDismiss(notification.id)}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#5A77FF] to-[#A052FF] flex items-center justify-center text text-xs font-bold flex-shrink-0">
        {(notification.senderName?.[0] || "?").toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text truncate">{notification.senderName}</p>
        <p className="text-xs text-gray-400 truncate">{notification.text || "📎 Sent a file"}</p>
      </div>
      <div
        onClick={e => { e.stopPropagation(); onDismiss(notification.id); }}
        className="p-1 text-gray-400 hover:text rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
      >
        <IoClose size={14} />
      </div>
    </div>
  );
}

function MediaBubble({ msg, own }) {
  const category = getMediaCategory(msg.mediaType, msg.mediaUrl);
  const bgAccent = own ? "bg-white/10 border-white/20" : "dark:bg-[#1C1E2A] bg-gray-100 border-white/5";
  const fileName = msg.originalName || msg.mediaUrl?.split("/").pop() || "File";

  if (category === "image") {
    return (
      <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
        <img
          src={msg.mediaUrl}
          alt={fileName}
          loading="lazy"
          className="rounded-xl max-w-full max-h-64 object-cover shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
        />
      </a>
    );
  }
  if (category === "video") {
    return <video src={msg.mediaUrl} controls className="rounded-xl max-w-full max-h-56 mb-2 shadow-sm" />;
  }
  if (category === "audio") {
    return (
      <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 mb-2custom-border${bgAccent}`}>
        <div className={`p-2 rounded-lg ${own ? "bg-white/20" : "bg-white/5"}`}>
          <IoMusicalNote size={18} className="text" />
        </div>
        <audio controls src={msg.mediaUrl} className="flex-1 h-8 min-w-0 invert" />
      </div>
    );
  }
  return (
    <a
      href={msg.mediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 mb-2custom-border${bgAccent} hover:opacity-80 transition-opacity`}
    >
      <div className={`p-2.5 rounded-lg flex-shrink-0 ${own ? "bg-white/20" : "bg-white/5"}`}>
        <IoDocument size={20} className="text" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate text">{fileName}</p>
        {msg.fileSize && <p className={`text-[10px] ${own ? "opacity-70" : "text-gray-400"}`}>{formatBytes(msg.fileSize)}</p>}
      </div>
      <IoDownload size={16} className={own ? "text-white/70" : "text-gray-400"} />
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
    <div className="flex items-center gap-3 dark:bg-[#1C1E2A] bg-gray-100custom-borderborder-white/5 rounded-xl px-3 py-2.5">
      <div className="w-10 h-10 rounded-lg bg-[#2A2D3A] flex items-center justify-center flex-shrink-0 overflow-hidden">
        {category === "image" && previewUrl
          ? <img src={previewUrl} alt="preview" className="w-full h-full object-cover rounded-lg" />
          : category === "video" ? <IoVideocam size={20} className="text-[#5A77FF]" />
            : category === "audio" ? <IoMusicalNote size={20} className="text-[#5A77FF]" />
              : <IoDocument size={20} className="text-[#5A77FF]" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text truncate">{file.name}</p>
        <p className="text-[10px] text-gray-400">{formatBytes(file.size)}</p>
      </div>
      <div
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors flex-shrink-0"
      >
        <IoClose size={15} />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function UserChat() {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("accessToken");

  const pushNotification = useNotifications();

  // ── State ──────────────────────────────────────────────────────────────────
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

  const [pendingFile, setPendingFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
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

  const [unreadCounts, setUnreadCounts] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
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
  const usersRef = useRef([]);
  const formatMessageRef = useRef(null);

  const getUserId = useCallback(() => (user && (user.userId || user.id)) || null, [user]);

  // ── Keep refs in sync ──────────────────────────────────────────────────────
  useEffect(() => { usersRef.current = users; }, [users]);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // ── Auto-scroll / scroll-restoration ──────────────────────────────────────
  useEffect(() => {
    if (isLoadingMoreRef.current && chatContainerRef.current) {
      const newScrollHeight = chatContainerRef.current.scrollHeight;
      chatContainerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
      return;
    }
    requestAnimationFrame(() => {
      const el = chatContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [messages]);

  // ── Notification helpers ───────────────────────────────────────────────────
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

  // ── Infinite scroll ────────────────────────────────────────────────────────
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

  // ── Close menus on outside click ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowGroupMenu(false);
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) setShowAttachMenu(false);
      if (contextMenu) setContextMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [contextMenu]);

  // ── formatMessage ──────────────────────────────────────────────────────────
  const formatMessage = useCallback((raw) => {
    const uid = getUserId();
    const currentUsers = usersRef.current;
    const senderId = raw.senderId ?? raw.sender?.id;
    let senderName = "Unknown";

    if (raw.Sender) {
      senderName = `${raw.Sender.firstName || ""} ${raw.Sender.lastName || ""}`.trim() || raw.Sender.email;
    } else if (raw.sender) {
      senderName = `${raw.sender.firstName || ""} ${raw.sender.lastName || ""}`.trim() || raw.sender.email;
    } else {
      const found = currentUsers.find(u => u.id === senderId);
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
  }, [user, getUserId]);

  useEffect(() => { formatMessageRef.current = formatMessage; }, [formatMessage]);

  // ── Socket Setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !user) {
      setLoading(false);
      setError("Not authenticated.");
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      autoConnect: false,
      path: "/socket.io",
      auth: { token },
      transportOptions: { polling: { extraHeaders: { token } } },
    });
    socketRef.current = socket;

    // ── Connection lifecycle ─────────────────────────────────────────────────
    socket.on("connect", () => {
      setConnectionStatus("connected");
      setError(null);
      socket.emit("UserList", { page: 1, limit: 100, search: "" });
      socket.emit("getMyGroups", { page: 1, limit: 100, search: "" });
      socket.emit("online", { userId: getUserId() });
    });

    socket.on("notification", (data) => {
      console.log("🔔 notification received:", data);
      pushNotification({
        title: data.title || "New Notification",
        body: data.body || "",
        type: data.type || "info",
      });
    });


    socket.on("connect_error", () => {
      setConnectionStatus("error");
      setLoading(false);
    });

    socket.on("disconnect", () => setConnectionStatus("disconnected"));

    // ── User & group lists ───────────────────────────────────────────────────
    socket.on("UserList", (res) => {
      if (!res?.success) {
        setError(res?.error || "Failed to load users");
        setLoading(false);
        return;
      }
      setUsers((res.data || []).map(u => ({
        ...u,
        onlineStatus: u.onlineStatus ?? u.onlineSatus ?? "offline",
        unseenCount: u.unreadCount ?? u.Messages?.length ?? 0,
      })));
      setLoading(false);
    });

    socket.on("getMyGroups", (res) => {
      if (res?.success) {
        setGroups(res.data || []);
      } else if (res?.error) {
        console.error("getMyGroups error:", res.error);
      }
    });

    // ── Real-time online/offline presence (backend emits userStatusChange) ───
    socket.on("userStatusChange", ({ userId: changedId, onlineSatus }) => {
      setUsers(prev =>
        prev.map(u =>
          u.id === changedId
            ? { ...u, onlineSatus, onlineStatus: onlineSatus }
            : u
        )
      );
      // Also update activeChat header if it's the same person
      setActiveChat(prev => {
        if (!prev || prev.type === "group") return prev;
        if (prev.id === changedId) {
          return { ...prev, onlineSatus, onlineStatus: onlineSatus };
        }
        return prev;
      });
    });

    // ── Group management ─────────────────────────────────────────────────────
    socket.on("createGroup", (data) => {
      setIsCreatingGroup(false);
      if (data?.error) { setError(data.error); return; }
      if (data?.roomId) {
        setGroups(prev => {
          if (prev.some(g => g.roomId === data.roomId)) return prev;
          return [{ roomId: data.roomId, type: "group", groupName: data.groupName }, ...prev];
        });
        setShowCreateGroup(false);
        setNewGroupName("");
        setSelectedMembers([]);
        setCreateModalSearch("");
        setActiveChat({ roomId: data.roomId, type: "group", groupName: data.groupName });
      }
    });

    socket.on("updateGroupName", ({ error, roomId, newName }) => {
      if (error) { setError(error); return; }
      setGroups(prev => prev.map(g => g.roomId === roomId ? { ...g, groupName: newName } : g));
      setActiveChat(prev => prev?.roomId === roomId ? { ...prev, groupName: newName } : prev);
    });

    socket.on("getGroupDetails", ({ error, roomId, participants }) => {
      if (error) { console.error("getGroupDetails error:", error); return; }
      setGroupMembers(participants || []);
    });

    socket.on("addGroupMembers", (data) => {
      if (data?.error) { setError(data.error); return; }
      setShowAddMembers(false);
      setSelectedNewMembers([]);
      setAddMemberSearch("");
      if (currentRoomRef.current === data.roomId) {
        socket.emit("getGroupDetails", { roomId: data.roomId });
      }
    });

    socket.on("removeGroupMember", (data) => {
      if (data?.error) { setError(data.error); return; }
      if (data?.removedMember) {
        setGroupMembers(prev => prev.filter(m => (m.id ?? m.userId) !== data.removedMember));
      }
    });

    socket.on("leaveGroup", (data) => {
      if (data?.error) { setError(data.error); return; }
      if (data?.removedMember) {
        setGroupMembers(prev => prev.filter(m => (m.id ?? m.userId) !== data.removedMember));
      } else if (data?.roomId) {
        setGroups(prev => prev.filter(g => g.roomId !== data.roomId));
        setActiveChat(prev => prev?.roomId === data.roomId ? null : prev);
        if (currentRoomRef.current === data.roomId) {
          currentRoomRef.current = null;
          setCurrentRoom(null);
          setMessages([]);
        }
      }
    });

    socket.on("groupDeleted", (data) => {
      if (data?.error) { setError(data.error); return; }
      if (data?.roomId) {
        setGroups(prev => prev.filter(g => g.roomId !== data.roomId));
        setActiveChat(prev => prev?.roomId === data.roomId ? null : prev);
        if (currentRoomRef.current === data.roomId) {
          currentRoomRef.current = null;
          setCurrentRoom(null);
          setMessages([]);
        }
        if (data.message) {
          addNotification({ senderName: "System", text: data.message, roomId: data.roomId });
        }
      }
    });

    socket.on("memberLeft", ({ leftMember }) => {
      setGroupMembers(prev => prev.filter(m => (m.id ?? m.userId) !== leftMember));
    });

    // ── Messages ─────────────────────────────────────────────────────────────
    socket.on("mychats", (res) => {
      if (!res?.success) return;
      const rows = Array.isArray(res?.data) ? res.data : [];
      const uid = getUserId();
      const fmt = rows.map(r => formatMessageRef.current(r)).reverse();

      currentPageRef.current = res.currentPage;
      totalPagesRef.current = res.totalPages;
      setCurrentPage(res.currentPage);
      setTotalPages(res.totalPages);
      setHasMore(res.currentPage < res.totalPages);

      if (res.currentPage === 1) {
        setMessages(fmt);
      } else {
        setMessages(prev => [...fmt, ...prev]);
      }

      fmt.forEach(m => {
        if (!m.seen && m.senderId !== uid) {
          socket.emit("seenMessage", { msg_id: m.id, roomId: currentRoomRef.current });
        }
      });
    });

    socket.on("receiveMessage", (raw) => {
      const msg = formatMessageRef.current(raw);
      const uid = getUserId();

      if (msg.roomId && msg.roomId !== currentRoomRef.current) {
        setUnreadCounts(prev => ({ ...prev, [msg.roomId]: (prev[msg.roomId] || 0) + 1 }));
        addNotification({
          senderName: msg.senderName,
          text: msg.text || (msg.mediaUrl ? "📎 Sent a file" : ""),
          roomId: msg.roomId,
        });
        socket.emit("UserList", { page: 1, limit: 100, search: "" });
        socket.emit("getMyGroups", { page: 1, limit: 100, search: "" });
        return;
      }

      if (msg.senderId !== uid) {
        socket.emit("seenMessage", { msg_id: msg.id, roomId: currentRoomRef.current });
      }

      setMessages(prev => {
        const isDuplicate = prev.some(m =>
          m.id === msg.id ||
          (m.text === msg.text &&
            m.senderId === msg.senderId &&
            Math.abs(new Date(m.timestamp) - new Date(msg.timestamp)) < 2000)
        );
        return isDuplicate ? prev : [...prev, msg];
      });
    });

    socket.on("seenMessage", (data) => {
      if (!data?.success) return;
      if (data.msg_id) {
        setMessages(prev =>
          prev.map(m => String(m.id) === String(data.msg_id) ? { ...m, seen: true } : m)
        );
      } else {
        setMessages(prev =>
          prev.map(m => m.senderId === getUserId() ? { ...m, seen: true } : m)
        );
      }
    });

    socket.on("Deleted", ({ id }) => {
      if (id) setMessages(prev => prev.filter(m => m.id !== id));
    });

    // ── Presence & typing ────────────────────────────────────────────────────
    socket.on("onlineUser", (res) => {
      if (res?.success) {
        socket.emit("UserList", { page: 1, limit: 100, search: "" });
      }
    });

    socket.on("typing", ({ roomId, userId: typingUid, isTyping }) => {
      if (roomId !== currentRoomRef.current || typingUid === getUserId()) return;
      if (!isTyping) { setTypingUser(null); return; }
      const found = usersRef.current.find(u => u.id === typingUid);
      setTypingUser(found ? getFullName(found) : "Someone");
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000);
    });

    socket.on("roomJoined", ({ roomId }) => {
      console.log("Joined room:", roomId);
    });

    socket.on("errorMessage", ({ error: msg }) => setError(msg));

    socket.connect();

    return () => {
      clearTimeout(typingTimerRef.current);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Search sidebar ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("UserList", { page: 1, limit: 100, search: searchQuery });
        socketRef.current.emit("getMyGroups", { page: 1, limit: 100, search: searchQuery });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Open / switch chat ─────────────────────────────────────────────────────
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
    setCurrentPage(1);
    currentPageRef.current = 1;
    setTotalPages(1);
    totalPagesRef.current = 1;
    setHasMore(false);
    setIsLoadingMore(false);
    isLoadingMoreRef.current = false;

    clearUnreadCount(roomId);

    if (!grp) {
      setUsers(prev =>
        prev.map(u => {
          const rid = buildRoomId(getUserId(), u.id);
          return rid === roomId ? { ...u, unseenCount: 0 } : u;
        })
      );
    } else {
      setGroups(prev =>
        prev.map(g => g.roomId === roomId ? { ...g, unreadCount: 0 } : g)
      );
    }

    socket.emit("joinRoom", { roomId, type: grp ? "group" : "private", members: [] });

    const loadTimer = setTimeout(() => {
      socket.emit("mychats", { roomId, page: 1 });
    }, 150);

    if (grp) {
      socket.emit("getGroupDetails", { roomId });
    }

    const refreshTimer = setTimeout(() => {
      socket.emit("UserList", { page: 1, limit: 100, search: "" });
    }, 500);

    return () => {
      clearTimeout(loadTimer);
      clearTimeout(refreshTimer);
    };
  }, [activeChat]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── File upload ────────────────────────────────────────────────────────────
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
          if (data.success) { resolve(data); }
          else { setUploadError(data.error || "Upload failed"); reject(data.error); }
        } catch {
          setUploadError("Invalid server response");
          reject("parse error");
        }
      } else {
        setUploadError(`Upload failed (${xhr.status})`);
        reject(xhr.status);
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setUploadError("Network error during upload");
      reject("network");
    };

    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setUploadError(`File exceeds ${MAX_FILE_MB} MB`);
      return;
    }
    setUploadError(null);
    setPendingFile(file);
    setShowAttachMenu(false);
    e.target.value = "";
  };

  // ── Send message ───────────────────────────────────────────────────────────
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
    } catch {
      // uploadError is already set inside uploadFile
    }
  };

  // ── Typing indicator ───────────────────────────────────────────────────────
  const handleTyping = () => {
    const socket = socketRef.current;
    if (!socket || !currentRoomRef.current) return;
    socket.emit("typing", {
      roomId: currentRoomRef.current,
      userId: getUserId(),
      isTyping: true,
    });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("typing", {
        roomId: currentRoomRef.current,
        userId: getUserId(),
        isTyping: false,
      });
    }, 1500);
  };

  // ── Message actions ────────────────────────────────────────────────────────
  const deleteMessage = (msg) => {
    socketRef.current?.emit("messageToDelete", { id: msg.id, senderId: msg.senderId });
    setContextMenu(null);
  };

  /**
   * Forward: since the backend has no dedicated forwardMessage handler,
   * we join the target room first, then sendMessage with the same content.
   */
  const handleForward = (targetRoomId) => {
    const socket = socketRef.current;
    if (!socket || !forwardMsg) return;

    // Join target room first
    socket.emit("joinRoom", { roomId: targetRoomId, type: "private", members: [] });

    // Small delay then send
    setTimeout(() => {
      socket.emit("sendMessage", {
        roomId: targetRoomId,
        message: forwardMsg.text || null,
        ...(forwardMsg.mediaUrl ? {
          mediaUrl: forwardMsg.mediaUrl,
          mediaType: forwardMsg.mediaType,
          originalName: forwardMsg.originalName,
          fileSize: forwardMsg.fileSize,
        } : {}),
      });
    }, 200);

    setForwardMsg(null);
    setForwardSearch("");
  };

  // ── Group actions ──────────────────────────────────────────────────────────
  const createGroup = () => {
    if (!newGroupName.trim() || !selectedMembers.length || isCreatingGroup) return;
    setIsCreatingGroup(true);
    socketRef.current?.emit("createGroup", {
      name: newGroupName.trim(),
      members: selectedMembers,
    });
    setTimeout(() => setIsCreatingGroup(false), 5000);
  };

  const renameGroup = () => {
    if (!editNameValue.trim()) return;
    socketRef.current?.emit("updateGroupName", {
      roomId: activeChat.roomId,
      newName: editNameValue.trim(),
    });
    setEditNameMode(false);
  };

  const leaveGroup = () => {
    if (!window.confirm("Leave this group?")) return;
    socketRef.current?.emit("leaveGroup", { roomId: activeChat.roomId });
    setShowGroupMenu(false);
  };

  const deleteGroup = () => {
    if (!window.confirm("Delete this group for everyone? This cannot be undone.")) return;
    socketRef.current?.emit("deleteGroup", { roomId: activeChat.roomId });
    setShowGroupMenu(false);
  };

  const openMembers = () => {
    setShowMembersPanel(true);
    setShowGroupMenu(false);
    socketRef.current?.emit("getGroupDetails", { roomId: activeChat.roomId });
  };

  const removeMember = (id) => {
    if (!window.confirm("Remove this member?")) return;
    socketRef.current?.emit("removeGroupMember", {
      roomId: activeChat.roomId,
      memberIdToRemove: id,
    });
  };

  const addMembers = () => {
    if (!selectedNewMembers.length) return;
    socketRef.current?.emit("addGroupMembers", {
      roomId: activeChat.roomId,
      newMembers: selectedNewMembers,
    });
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    getFullName(u).toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    (g.groupName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isGroup = activeChat?.type === "group";

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

  const canSend = !!(messageText.trim() || pendingFile) && !isUploading && connectionStatus === "connected";

  // ── Early return ───────────────────────────────────────────────────────────
  if (!user) return (
    <div className="flex items-center justify-center h-screen bg-[#0B0E17]">
      <div className="w-8 h-8 border-4 border-[#5A77FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-[85vh] overflow-hidden gap-6 bg-transparent"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,audio/*" className="hidden" onChange={handleFileSelect} />

      {/* ══ GLOBAL ERROR BANNER ══════════════════════════════════════════════ */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 bg-red-500/20custom-borderborder-red-500/40 text-red-300 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-sm">
          <span className="text-sm font-medium">⚠️ {error}</span>
          <div onClick={() => setError(null)} className="cursor-pointer hover:text-red-200 p-1"><IoClose size={16} /></div>
        </div>
      )}

      {/* ══ CREATE GROUP MODAL ════════════════════════════════════════════════ */}
      {showCreateGroup && (
        <Modal
          title="New Group"
          onClose={() => { setShowCreateGroup(false); setNewGroupName(""); setSelectedMembers([]); setCreateModalSearch(""); }}
          footer={<>
            <div
              onClick={() => { setShowCreateGroup(false); setNewGroupName(""); setSelectedMembers([]); setCreateModalSearch(""); }}
              className="px-4 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </div>
            <div
              onClick={createGroup}
              className={`px-5 py-2 text-sm font-semibold bg-gradient-to-r from-[#5A77FF] to-[#A052FF] text-white rounded-xl transition-colors cursor-pointer
                ${(!newGroupName.trim() || !selectedMembers.length || isCreatingGroup) ? "opacity-40 pointer-events-none" : "hover:opacity-90"}`}
            >
              {isCreatingGroup ? "Creating…" : "Create"}
            </div>
          </>}
        >
          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Group Name</label>
            <input
              type="text"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createGroup()}
              placeholder="e.g. Design Team"
              autoFocus
              className="w-full px-4 py-2.5 dark:bg-[#1C1E2A] bg-gray-100 textcustom-borderborder-white/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#5A77FF] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Add Members ({selectedMembers.length} selected)
            </label>
            <SearchInput value={createModalSearch} onChange={setCreateModalSearch} placeholder="Search people…" />
          </div>
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedMembers.map(id => {
                const u = users.find(x => x.id === id);
                return (
                  <span key={id} className="flex items-center gap-1 bg-[#5A77FF]/20 text-[#7C93FF] text-xs font-medium px-2.5 py-1 rounded-fullcustom-borderborder-[#5A77FF]/30">
                    {getFullName(u)}
                    <div onClick={() => setSelectedMembers(prev => prev.filter(m => m !== id))} className="cursor-pointer hover:text ml-0.5">
                      <IoClose size={13} />
                    </div>
                  </span>
                );
              })}
            </div>
          )}
          <div className="max-h-52 overflow-y-auto space-y-0.5 -mx-1 scrollbar-hide">
            {users
              .filter(u => getFullName(u).toLowerCase().includes(createModalSearch.toLowerCase()))
              .map(u => {
                const sel = selectedMembers.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => setSelectedMembers(prev => sel ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${sel ? "bg-white/10" : "hover:bg-white/5"}`}
                  >
                    <div className={`w-5 h-5 rounded-md custom-border flex items-center justify-center flex-shrink-0 ${sel ? "bg-[#5A77FF] border-[#5A77FF]" : "border-gray-500"}`}>
                      {sel && <IoCheckmark size={12} className="text-white" />}
                    </div>
                    <Avatar entity={u} size={8} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text truncate">{getFullName(u)}</p>
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
        <Modal title="Forward Message" onClose={() => { setForwardMsg(null); setForwardSearch(""); }}>
          <div className="dark:bg-[#1C1E2A] bg-gray-100 rounded-xl p-3 text-sm text-gray-300 italiccustom-borderborder-white/5 truncate">
            {forwardMsg.mediaUrl ? `📎 ${forwardMsg.originalName || "File"}` : `"${forwardMsg.text}"`}
          </div>
          <SearchInput value={forwardSearch} onChange={setForwardSearch} placeholder="Search conversations…" />
          <div className="max-h-64 overflow-y-auto space-y-0.5 -mx-1 scrollbar-hide">
            {forwardTargets.map(t => (
              <div
                key={t.roomId}
                onClick={() => handleForward(t.roomId)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors group"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0
                  ${t.isGroup ? "bg-gradient-to-br from-violet-500 to-fuchsia-600" : "bg-[#333541]"}`}>
                  {t.isGroup ? <HiUserGroup size={16} /> : (t.label?.[0] ?? "?").toUpperCase()}
                </div>
                <span className="text-sm font-medium text flex-1 truncate">{t.label ?? "Unnamed"}</span>
                <IoArrowForward size={16} className="text-[#5A77FF] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
            {!forwardTargets.length && (
              <p className="text-center text-sm text-gray-500 py-6">No conversations found.</p>
            )}
          </div>
        </Modal>
      )}

      {/* ══ ADD MEMBERS MODAL ════════════════════════════════════════════════ */}
      {showAddMembers && (
        <Modal
          title="Add Members"
          onClose={() => { setShowAddMembers(false); setSelectedNewMembers([]); setAddMemberSearch(""); }}
          footer={<>
            <div
              onClick={() => { setShowAddMembers(false); setSelectedNewMembers([]); setAddMemberSearch(""); }}
              className="px-4 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </div>
            <div
              onClick={addMembers}
              className={`px-5 py-2 text-sm font-semibold bg-gradient-to-r from-[#5A77FF] to-[#A052FF] text-white rounded-xl cursor-pointer transition-colors
                ${!selectedNewMembers.length ? "opacity-40 pointer-events-none" : "hover:opacity-90"}`}
            >
              Add {selectedNewMembers.length > 0 ? `(${selectedNewMembers.length})` : ""}
            </div>
          </>}
        >
          <SearchInput value={addMemberSearch} onChange={setAddMemberSearch} placeholder="Search users…" />
          {selectedNewMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedNewMembers.map(id => {
                const u = users.find(x => x.id === id);
                return (
                  <span key={id} className="flex items-center gap-1 bg-[#5A77FF]/20 text-[#7C93FF] text-xs font-medium px-2.5 py-1 rounded-fullcustom-borderborder-[#5A77FF]/30">
                    {getFullName(u)}
                    <div onClick={() => setSelectedNewMembers(prev => prev.filter(m => m !== id))} className="cursor-pointer hover:text">
                      <IoClose size={13} />
                    </div>
                  </span>
                );
              })}
            </div>
          )}
          <div className="max-h-64 overflow-y-auto space-y-0.5 -mx-1 scrollbar-hide">
            {addableUsers.map(u => {
              const sel = selectedNewMembers.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedNewMembers(prev => sel ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${sel ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  <div className={`w-5 h-5 rounded-md custom-border flex items-center justify-center flex-shrink-0 ${sel ? "bg-[#5A77FF] border-[#5A77FF]" : "border-gray-500"}`}>
                    {sel && <IoCheckmark size={12} className="text-white" />}
                  </div>
                  <Avatar entity={u} size={8} />
                  <p className="text-sm font-semibold text truncate flex-1">{getFullName(u)}</p>
                </div>
              );
            })}
            {!addableUsers.length && <p className="text-center text-sm text-gray-500 py-4">No users to add.</p>}
          </div>
        </Modal>
      )}

      {/* ══ CONTEXT MENU ════════════════════════════════════════════════════ */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: contextMenu.y, left: contextMenu.x, position: "fixed", zIndex: 9999 }}
          className="translucent-background rounded-xl shadow-2xlcustom-borderborder-white/10 overflow-hidden min-w-[160px] py-1"
        >
          <MenuItem
            icon={<IoArrowUndo size={15} className="text-gray-400" />}
            label="Reply"
            onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null); textareaRef.current?.focus(); }}
          />
          <MenuItem
            icon={<IoArrowForward size={15} className="text-gray-400" />}
            label="Forward"
            onClick={() => { setForwardMsg(contextMenu.msg); setContextMenu(null); }}
          />
          {contextMenu.msg.senderId === getUserId() && (
            <MenuItem
              icon={<IoTrash size={15} />}
              label="Delete"
              variant="danger"
              onClick={() => deleteMessage(contextMenu.msg)}
            />
          )}
        </div>
      )}

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <div
        className={`${sidebarCollapsed ? "w-[72px]" : "w-[320px]"} flex flex-col rounded-2xlcustom-borderborder-white/5 transition-all duration-300 flex-shrink-0 translucent-background relative`}
      >
        {/* Sidebar Header */}
        <div className="px-4 py-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            {!sidebarCollapsed && (
              <h2 className="text-xl font-bold text tracking-tight">Conversations</h2>
            )}
            <div className={`flex items-center gap-2 ${sidebarCollapsed ? "w-full justify-center" : "ml-auto"}`}>
              {!sidebarCollapsed && (
                <div
                  onClick={() => setShowCreateGroup(true)}
                  className="p-1.5 bg-white/5 text-gray-300 hover:text rounded-lg transition-all cursor-pointer"
                  title="New Group"
                >
                  <IoAdd size={20} />
                </div>
              )}
              {/* ✅ SIDEBAR COLLAPSE TOGGLE — was missing before */}
              <div
                onClick={() => setSidebarCollapsed(prev => !prev)}
                className="p-1.5 bg-white/5 text-gray-300 hover:text rounded-lg transition-all cursor-pointer"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <IoChevronForward size={18} /> : <IoChevronBack size={18} />}
              </div>
            </div>
          </div>
          {!sidebarCollapsed && (
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search teammates..." />
          )}
        </div>

        {/* Sidebar List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-hide">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 custom-border border-[#5A77FF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Groups */}
              {filteredGroups.length > 0 && (
                <div className="mb-2">
                  {!sidebarCollapsed && filteredGroups.length > 0 && (
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-1.5">Groups</p>
                  )}
                  {filteredGroups.map(g => {
                    const active = activeChat?.roomId === g.roomId && activeChat?.type === "group";
                    const localCount = unreadCounts[g.roomId] || 0;
                    const backendCount = g.unreadCount || 0;
                    const totalCount = localCount > 0 ? localCount : backendCount;
                    return (
                      <div
                        key={g.id ?? g.roomId}
                        onClick={() => setActiveChat({ ...g, type: "group" })}
                        title={sidebarCollapsed ? g.groupName : undefined}
                        className={`flex items-center gap-3 px-2 py-3 mb-0.5 rounded-2xl transition-all cursor-pointer
                          ${active ? "dark:bg-[#333545] bg-gray-100" : "hover:bg-white/5"}`}
                      >
                        <Avatar entity={{ ...g, type: "group" }} size={10} />
                        {!sidebarCollapsed && (
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                            <div className="min-w-0">
                              <span className="text-[14px] font-semibold truncate text block">
                                {g.groupName || "Unnamed Group"}
                              </span>
                              <span className="text-xs text-gray-400">Group</span>
                            </div>
                            {totalCount > 0 && (
                              <span className="flex-shrink-0 ml-2 bg-[#5A77FF] text-white text-[10px] font-bold min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center">
                                {totalCount > 99 ? "99+" : totalCount}
                              </span>
                            )}
                          </div>
                        )}
                        {sidebarCollapsed && totalCount > 0 && (
                          <span className="absolute top-1 right-1 w-4 h-4 bg-[#5A77FF] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {totalCount > 9 ? "9+" : totalCount}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Users */}
              {filteredUsers.length > 0 && (
                <div>
                  {!sidebarCollapsed && (
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-1.5">Direct Messages</p>
                  )}
                  {filteredUsers.map(u => {
                    const active = activeChat?.id === u.id && activeChat?.type !== "group";
                    const rid = buildRoomId(getUserId(), u.id);
                    const localCount = unreadCounts[rid] || 0;
                    const backendCount = u.unseenCount || 0;
                    const totalCount = localCount > 0 ? localCount : backendCount;
                    const isOnline = u.onlineStatus === "online" || u.onlineSatus === "online";
                    return (
                      <div
                        key={u.id}
                        onClick={() => setActiveChat(u)}
                        title={sidebarCollapsed ? getFullName(u) : undefined}
                        className={`flex items-center gap-3 px-2 py-3 mb-0.5 rounded-2xl transition-all cursor-pointer
                          ${active ? "dark:bg-[#2A2B38] bg-gray-100" : "hover:bg-white/5"}`}
                      >
                        <Avatar entity={u} size={10} />
                        {!sidebarCollapsed && (
                          <div className="flex-1 min-w-0 flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                              <span className="text-[14px] font-bold truncate text block">{getFullName(u)}</span>
                              <p className={`text-xs truncate leading-relaxed mt-0.5 flex items-center gap-1 ${isOnline ? "text-emerald-400" : "text-gray-400"}`}>
                                {isOnline && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block flex-shrink-0" />}
                                {isOnline ? "Online" : (u.role || "Team Member")}
                              </p>
                            </div>
                            {totalCount > 0 && (
                              <span className="flex-shrink-0 bg-[#5A77FF] text-white text-[10px] font-bold min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center mt-0.5">
                                {totalCount > 99 ? "99+" : totalCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {!filteredGroups.length && !filteredUsers.length && (
                <p className="text-center text-sm text-gray-500 py-10">No conversations found.</p>
              )}
            </>
          )}
        </div>

        {/* Collapsed: new group button at bottom */}
        {sidebarCollapsed && (
          <div className="px-2 pb-4 flex justify-center">
            <div
              onClick={() => setShowCreateGroup(true)}
              className="p-2 bg-white/5 text-gray-300 hover:text rounded-xl transition-all cursor-pointer"
              title="New Group"
            >
              <IoAdd size={20} />
            </div>
          </div>
        )}
      </div>

      {/* ══ CHAT AREA ════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-2xlcustom-borderborder-white/5 translucent-background min-w-0">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0 z-20">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar entity={activeChat} size={12} header={true} />
                <div className="min-w-0">
                  {editNameMode && isGroup ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editNameValue}
                        onChange={e => setEditNameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") renameGroup(); if (e.key === "Escape") setEditNameMode(false); }}
                        autoFocus
                        className="dark:bg-[#1C1E2A] bg-gray-100 textcustom-borderborder-white/10 rounded-lg px-2.5 py-1 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[#5A77FF]"
                      />
                      <div onClick={renameGroup} className="text-white bg-emerald-500 hover:bg-emerald-600 p-1.5 rounded-lg cursor-pointer">
                        <IoCheckmark size={14} />
                      </div>
                      <div onClick={() => setEditNameMode(false)} className="text-gray-400 hover:text bg-white/5 p-1.5 rounded-lg cursor-pointer">
                        <IoClose size={14} />
                      </div>
                    </div>
                  ) : (
                    <h3 className="text-lg font-bold text truncate leading-none mb-1">
                      {isGroup ? (activeChat.groupName || "Group") : getFullName(activeChat)}
                    </h3>
                  )}
                  <p className="text-sm text-gray-400 truncate leading-none">
                    {isGroup
                      ? (groupMembers.length > 0 ? `${groupMembers.length} members` : "Group")
                      : (activeChat.role || "Team Member")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* ✅ Online status uses unified onlineStatus/onlineSatus check */}
                {!isGroup && (activeChat.onlineStatus === "online" || activeChat.onlineSatus === "online") && (
                  <span className="text-sm text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block animate-pulse" />
                    Online now
                  </span>
                )}
                {isGroup && (
                  <div className="relative" ref={menuRef}>
                    <div
                      onClick={() => setShowGroupMenu(prev => !prev)}
                      className="p-2 rounded-xl text-gray-400 hover:text hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <IoEllipsisVertical size={20} />
                    </div>
                    {showGroupMenu && (
                      <div className="absolute right-0 top-full mt-1.5 w-52 dark:bg-[#1C1E2A] bg-white rounded-xl shadow-2xlcustom-borderborder-white/10 overflow-hidden z-50 py-1">
                        <MenuItem icon={<IoPeople size={15} className="text-gray-400" />} label="View Members" onClick={openMembers} />
                        <MenuItem
                          icon={<IoPersonAdd size={15} className="text-gray-400" />}
                          label="Add Members"
                          onClick={() => { setShowAddMembers(true); setShowGroupMenu(false); }}
                        />
                        <MenuItem
                          icon={<IoPencil size={15} className="text-gray-400" />}
                          label="Edit Name"
                          onClick={() => { setEditNameMode(true); setEditNameValue(activeChat.groupName || ""); setShowGroupMenu(false); }}
                        />
                        <div className="border-t border-white/5 my-1" />
                        <MenuItem icon={<IoExit size={15} />} label="Leave Group" variant="warning" onClick={leaveGroup} />
                        <MenuItem icon={<IoTrash size={15} />} label="Delete Group" variant="danger" onClick={deleteGroup} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Messages List */}
            <div
              className="flex-1 overflow-y-auto px-6 py-6 flex flex-col scrollbar-hide"
              ref={chatContainerRef}
              onScroll={handleScrollUp}
              onClick={() => { setShowGroupMenu(false); setContextMenu(null); }}
            >
              {isLoadingMore && (
                <div className="flex justify-center py-3">
                  <div className="flex items-center gap-2 dark:bg-[#1C1E2A] bg-gray-100custom-borderborder-white/5 rounded-full px-4 py-2 shadow-sm">
                    <div className="w-4 h-4 custom-border border-[#5A77FF] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-400 font-medium">Loading older messages…</span>
                  </div>
                </div>
              )}

              {hasMore && !isLoadingMore && messages.length > 0 && (
                <div className="flex justify-center py-2">
                  <span className="text-[11px] text-gray-500 font-medium">↑ Scroll up for older messages</span>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    {isGroup
                      ? <HiUserGroup className="w-10 h-10 text-gray-500" />
                      : <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>}
                  </div>
                  <p className="text-base font-bold text-gray-300">No messages yet</p>
                  <p className="text-sm text-gray-500 mt-1">Say hello 👋</p>
                </div>
              ) : (
                <>
                  <div className="flex-1" />
                  <div className="space-y-4">
                    {messages.map((msg, idx) => {
                      const own = msg.senderId === getUserId();
                      const showDate = idx === 0 ||
                        new Date(msg.timestamp) - new Date(messages[idx - 1].timestamp) > 300000;

                      return (
                        <div key={msg.id || `${msg.senderId}-${msg.timestamp}-${idx}`}>
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <span className="text-xs font-medium text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                                {dateStr(msg.timestamp)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${own ? "justify-end" : "justify-start"} group relative`}>
                            {/* Hover action buttons */}
                            <div
                              className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 z-10
                                ${own ? "right-[calc(100%+8px)]" : "left-[calc(100%+8px)]"}`}
                            >
                              <div
                                onClick={() => { setReplyTo(msg); textareaRef.current?.focus(); }}
                                className="p-1.5 rounded-full dark:bg-[#1C1E2A] bg-gray-200custom-borderborder-white/5 hover:bg-white/10 text-gray-400 cursor-pointer"
                                title="Reply"
                              >
                                <IoArrowUndo size={13} />
                              </div>
                              <div
                                onClick={() => setForwardMsg(msg)}
                                className="p-1.5 rounded-full dark:bg-[#1C1E2A] bg-gray-200custom-borderborder-white/5 hover:bg-white/10 text-gray-400 cursor-pointer"
                                title="Forward"
                              >
                                <IoArrowForward size={13} />
                              </div>
                              {own && (
                                <div
                                  onClick={() => deleteMessage(msg)}
                                  className="p-1.5 rounded-full dark:bg-[#1C1E2A] bg-gray-200 custom-borde rborder-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 cursor-pointer"
                                  title="Delete"
                                >
                                  <IoTrash size={13} />
                                </div>
                              )}
                            </div>

                            {/* Message bubble */}
                            <div
                              className={`relative max-w-[70%] px-4 py-3 shadow-lg
                                ${own
                                  ? "bg-gradient-to-r from-[#5A77FF] to-[#A052FF] text-white rounded-[18px] rounded-br-md"
                                  : "dark:bg-[#2A2B38] bg-gray-100 text-gray-700 dark:text-white rounded-[18px] rounded-bl-md"}`}
                              onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, msg }); }}
                            >
                              {/* Group sender name */}
                              {!own && isGroup && (
                                <p className="text-[12px] font-bold text-[#A052FF] mb-1 tracking-wide">
                                  {msg.senderName}
                                </p>
                              )}

                              {/* Reply preview */}
                              {msg.replyToMessage && (
                                <div className="text-xs rounded-lg px-3 py-2 mb-2 border-l-4 bg-black/20 border-white/40 cursor-pointer">
                                  <p className="font-bold mb-0.5 opacity-90">
                                    {msg.replyToMessage.senderId === getUserId() ? "You" : (msg.replyToMessage.senderName || msg.senderName)}
                                  </p>
                                  <p className="truncate opacity-70">
                                    {msg.replyToMessage.message || msg.replyToMessage.text || "📎 File"}
                                  </p>
                                </div>
                              )}

                              {/* Media */}
                              {msg.mediaUrl && <MediaBubble msg={msg} own={own} />}

                              {/* Text + timestamp */}
                              <div className="relative inline-block w-full">
                                {msg.text && (
                                  <p className={`text-[14px] leading-relaxed break-words whitespace-pre-wrap m-0
                                    ${own ? "text-white" : "dark:text-gray-200 text-gray-700"}`}>
                                    {msg.text}
                                  </p>
                                )}
                                <div className="mt-1 flex items-center gap-1 justify-end text-[10px] opacity-60">
                                  <span>{timeStr(msg.timestamp)}</span>
                                  {own && (
                                    msg.seen
                                      ? <IoCheckmarkDone size={12} className="text-sky-300 opacity-100" title="Seen" />
                                      : <IoCheckmark size={12} title="Sent" />
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
                    <div className="flex justify-start mt-3">
                      <div className="dark:bg-[#2A2B38] bg-gray-100 rounded-[18px] rounded-bl-md px-4 py-2.5 shadow-sm flex items-center gap-2">
                        <span className="text-xs text-gray-400">{typingUser} is typing</span>
                        <div className="flex gap-1">
                          {[0, 150, 300].map(d => (
                            <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Reply preview strip */}
            {replyTo && (
              <div className="px-6 py-3 dark:bg-[#1C1E2A] bg-gray-50 border-t border-white/5 flex items-center gap-3 flex-shrink-0">
                <div className="flex-1 min-w-0 border-l-4 border-[#5A77FF] pl-3">
                  <p className="text-sm font-bold text-[#5A77FF] mb-0.5">
                    Replying to {replyTo.senderId === getUserId() ? "yourself" : replyTo.senderName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {replyTo.mediaUrl ? `📎 ${replyTo.originalName || "File"}` : replyTo.text}
                  </p>
                </div>
                <div
                  onClick={() => setReplyTo(null)}
                  className="text-gray-400 hover:text p-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0 cursor-pointer"
                >
                  <IoClose size={18} />
                </div>
              </div>
            )}

            {/* ── INPUT AREA ────────────────────────────────────────────────── */}
            <div className="px-5 py-4 flex-shrink-0 z-20 w-full border-t border-white/5">
              {pendingFile && (
                <div className="mb-3">
                  <FilePreview file={pendingFile} onRemove={() => { setPendingFile(null); setUploadError(null); setUploadProgress(0); }} />
                </div>
              )}

              {isUploading && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#5A77FF] font-medium flex items-center gap-1.5">
                      <IoCloudUpload size={13} /> Uploading…
                    </span>
                    <span className="text-xs text-gray-400">{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 dark:bg-[#1C1E2A] bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#5A77FF] to-[#A052FF] rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-red-400 font-medium mb-3 flex items-center gap-1.5">
                  ⚠️ {uploadError}
                  <span onClick={() => setUploadError(null)} className="cursor-pointer underline hover:text-red-300 ml-1">
                    Dismiss
                  </span>
                </p>
              )}

              <div className="flex items-end gap-3">
                <div className="flex-1 dark:bg-[#1C1E2A] bg-gray-100custom-borderborder-white/5 rounded-[14px] px-4 py-3 flex items-center min-w-0">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={messageText}
                    onChange={e => { setMessageText(e.target.value); handleTyping(); }}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    }}
                    placeholder={
                      isUploading ? "Uploading…"
                        : pendingFile ? "Add a caption… (optional)"
                          : connectionStatus === "connected" ? "Type your message..."
                            : "Reconnecting…"
                    }
                    disabled={connectionStatus !== "connected" || isUploading}
                    className="flex-1 bg-transparent px-1 py-0.5 text-[14px] text resize-none focus:outline-none max-h-28 placeholder-gray-500 leading-snug scrollbar-hide min-w-0"
                    style={{ fieldSizing: "content" }}
                  />
                </div>

                {/* Attach button */}
                <div className="relative flex-shrink-0" ref={attachMenuRef}>
                  <button
                    onClick={() => setShowAttachMenu(prev => !prev)}
                    title="Attach file"
                    className={`flex items-center gap-2 px-4 py-3 rounded-[14px] transition-all font-medium text-[14px] h-full
                      ${showAttachMenu
                        ? "bg-white/10 text-white"
                        : "dark:bg-[#1C1E2A] bg-gray-100custom-borderborder-white/5 text-gray-300 hover:text hover:bg-white/5"}`}
                  >
                    <IoAttach size={19} />
                    <span className="hidden sm:inline">Attach</span>
                  </button>
                  {showAttachMenu && (
                    <div className="absolute bottom-full mb-2 right-0 dark:bg-[#1C1E2A] bg-white rounded-xl shadow-2xlcustom-borderborder-white/10 py-1.5 w-48 z-20 overflow-hidden">
                      <div
                        onClick={() => imageInputRef.current?.click()}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <IoImage size={14} className="text-purple-400" />
                        </div>
                        <span className="font-medium text">Photo / Video</span>
                      </div>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <IoDocument size={14} className="text-[#5A77FF]" />
                        </div>
                        <span className="font-medium text">Document / File</span>
                      </div>
                      <div className="px-4 pt-1 pb-1.5">
                        <p className="text-[10px] text-gray-500">Max {MAX_FILE_MB} MB per file</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Send button */}
                <button
                  onClick={canSend ? sendMessage : undefined}
                  disabled={!canSend}
                  className={`flex items-center gap-2 px-5 py-3 rounded-[14px] transition-all font-semibold text-[14px] flex-shrink-0
                    ${canSend
                      ? "bg-gradient-to-r from-[#5A77FF] to-[#A052FF] text-white hover:opacity-90 cursor-pointer"
                      : "dark:bg-[#1C1E2A] bg-gray-100 text-gray-500 cursor-not-allowedcustom-borderborder-white/5"}`}
                >
                  {isUploading
                    ? <div className="w-4 h-4 custom-border border-white border-t-transparent rounded-full animate-spin" />
                    : <><IoSend size={17} /> <span className="hidden sm:inline">Send</span></>}
                </button>
              </div>

              {connectionStatus !== "connected" && (
                <p className="text-xs text-red-400 font-medium mt-2 px-1 animate-pulse">
                  {connectionStatus === "error"
                    ? "⚠️ Connection failed — check your network"
                    : "🔄 Reconnecting…"}
                </p>
              )}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-5">
              <svg className="w-12 h-12 text-[#5A77FF]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text mb-2">Your Messages</h3>
            <p className="text-[15px] text-gray-400 text-center max-w-xs leading-relaxed">
              Select a conversation from the left or create a new group.
            </p>
            <div
              onClick={() => setShowCreateGroup(true)}
              className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5A77FF] to-[#A052FF] text-white rounded-xl font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity"
            >
              <IoAdd size={18} /> New Group
            </div>
          </div>
        )}
      </div>

      {/* ══ GROUP MEMBERS PANEL ══════════════════════════════════════════════ */}
      {showMembersPanel && isGroup && (
        <div className="w-[270px]custom-borderborder-white/5 rounded-2xl flex flex-col translucent-background flex-shrink-0">
          <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
            <h4 className="text-[14px] font-bold text">Members ({groupMembers.length})</h4>
            <div className="flex items-center gap-2">
              <div
                onClick={() => { setShowAddMembers(true); setShowMembersPanel(false); }}
                className="p-1.5 text-[#5A77FF] bg-[#5A77FF]/10 hover:bg-[#5A77FF]/20 rounded-lg transition-colors cursor-pointer"
                title="Add member"
              >
                <IoPersonAdd size={15} />
              </div>
              <div
                onClick={() => setShowMembersPanel(false)}
                className="p-1.5 text-gray-400 hover:text rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <IoClose size={17} />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
            {groupMembers.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 custom-border border-[#5A77FF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              groupMembers.map(member => {
                const mid = member.id ?? member.userId;
                const isSelf = mid === getUserId();
                const isOnline = member.onlineStatus === "online" || member.onlineSatus === "online";
                return (
                  <div
                    key={mid}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors group"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar entity={member} size={9} />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full custom-border border-[#161821]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text truncate">
                        {getFullName(member)}{isSelf ? " (You)" : ""}
                      </p>
                      <p className={`text-[11px] truncate mt-0.5 ${isOnline ? "text-emerald-400" : "text-gray-500"}`}>
                        {isOnline ? "Online" : (member.role || "Member")}
                      </p>
                    </div>
                    {!isSelf && (
                      <div
                        onClick={() => removeMember(mid)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer flex-shrink-0"
                        title="Remove member"
                      >
                        <IoPersonRemove size={14} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ══ NOTIFICATION TOASTS ══════════════════════════════════════════════ */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
          {notifications.map(n => (
            <div key={n.id} className="pointer-events-auto">
              <NotificationToast notification={n} onDismiss={dismissNotification} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}