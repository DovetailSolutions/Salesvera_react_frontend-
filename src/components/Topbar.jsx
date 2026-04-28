import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, Menu, Eye, EyeOff, Moon, Sun, Settings2, LockKeyhole, X, CheckCheck, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { adminApi } from "../api";
import { AuthContext } from "../context/AuthProvider";
import { ThemeContext } from "../context/ThemeProvider";
import { useNotifications } from "../utils/NotificationContext";

const TYPE_STYLES = {
  info: { dot: "bg-blue-500", badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  success: { dot: "bg-emerald-500", badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  warning: { dot: "bg-amber-500", badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  error: { dot: "bg-red-500", badge: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" },
};

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function Topbar({ onOpenSidebar, routes = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const menuRef = useRef(null);
  const bellRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { notifications, unreadCount, markRead, markAllRead, remove, clearAll } = useNotifications();

  // ── Dynamic Route Meta ────────────────────────────────────────────────────
  const headerMeta = useMemo(() => {
    const defaultMeta = { title: "Dashboard", subtitle: "Here's a live view of your revenue and operations." };
    const flatRoutes = routes.flatMap((section) => section.routes || []);
    const activeRoute = flatRoutes.find((r) => r.path === location.pathname);
    if (activeRoute) return { title: activeRoute.label, subtitle: activeRoute.subtitle, icon: activeRoute.icon };
    if (location.pathname.includes("profile")) return { title: "Profile Settings", subtitle: "Manage your personal account details." };
    return { title: "Overview", subtitle: "Manage your operations here." };
  }, [location.pathname, routes]);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const handleUpdatePassword = async (data) => {
    try {
      await adminApi.updatePassword({ oldPassword: data.oldPassword, newPassword: data.newPassword });
      toast.success("Password updated successfully!");
      setShowPasswordModal(false);
      reset();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update password");
    }
  };

  // ── Close menus on outside click ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getInitials = (firstName, lastName) => {
    if (!firstName) return "U";
    return `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ""}`.toUpperCase();
  };

  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between z-0 relative p-6 px-0 bg-transparent backdrop-blur-xl">
      <Toaster position="top-right" />

      <div className="flex items-start gap-4">
        {/* Mobile menu button */}
        <div
          className="mt-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 lg:hidden transition-colors shadow-sm cursor-pointer"
          onClick={onOpenSidebar}
        >
          <Menu className="h-5 w-5" />
        </div>

        {/* Dynamic Route Icon */}
        {headerMeta.icon && (
          <div className="hidden lg:flex mt-1 h-12 w-12 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-500 shadow-sm">
            {headerMeta.icon}
          </div>
        )}

        {/* Title */}
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{headerMeta.title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">{headerMeta.subtitle}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative group sm:w-72">
          <input
            type="text"
            placeholder="Search dashboard..."
            className="w-full translucent-inner pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* ── Bell ─────────────────────────────────────────────────────── */}
          <div className="relative" ref={bellRef}>
            <div
              onClick={() => { setBellOpen((p) => !p); if (!bellOpen && unreadCount > 0) markAllRead(); }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer relative"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>

            <AnimatePresence>
              {bellOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-[340px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 z-50 overflow-hidden flex flex-col max-h-[480px]"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-bold text-slate-800 dark:text-white">Notifications</span>
                      {notifications.length > 0 && (
                        <span className="text-[11px] font-semibold text-slate-400">({notifications.length})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {notifications.length > 0 && (
                        <>
                          <button
                            onClick={markAllRead}
                            title="Mark all read"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
                          >
                            <CheckCheck size={14} />
                          </button>
                          <button
                            onClick={clearAll}
                            title="Clear all"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* List */}
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                          <Bell className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">All caught up</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No notifications yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.map((n) => {
                          const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
                          return (
                            <div
                              key={n.id}
                              onClick={() => markRead(n.id)}
                              className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!n.read ? "bg-violet-50/40 dark:bg-violet-500/5" : ""}`}
                            >
                              {/* Type dot */}
                              <div className="flex-shrink-0 mt-1.5">
                                <span className={`block w-2 h-2 rounded-full ${style.dot}`} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-semibold leading-snug ${n.read ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-white"}`}>
                                  {n.title}
                                </p>
                                {n.body && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                    {n.body}
                                  </p>
                                )}
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(n.timestamp)}</p>
                              </div>

                              {/* Unread pip + remove */}
                              <div className="flex-shrink-0 flex flex-col items-end gap-2 ml-1">
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                                  className="p-1 rounded-md text-slate-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Remove"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          <div
            onClick={toggleTheme}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
          </div>

          {/* Settings */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm hidden sm:flex">
            <Settings2 className="h-4 w-4" />
          </div>

          {/* User Profile Pill & Dropdown */}
          <div className="relative" ref={menuRef}>
            <div
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 cursor-pointer hover:shadow-md transition-all shadow-sm select-none"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white shadow-inner">
                {user ? getInitials(user.firstName, user.lastName) : "U"}
              </div>
              <div className="hidden sm:block pr-2">
                <p className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
                  {user ? `${user.firstName}` : "User"}
                </p>
                <p className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {user?.role?.replace(/_/g, " ") || "Admin"}
                </p>
              </div>
            </div>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 py-2 z-50 overflow-hidden"
                >
                  <div
                    onClick={() => { navigate("/profile"); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    View Profile
                  </div>
                  <div
                    onClick={() => { setShowPasswordModal(true); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    Update Password
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                  <div
                    onClick={async () => { await logout(); navigate("/login"); toast.success("You have been successfully signed out."); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    Logout
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 🔒 Update Password Modal — unchanged from original */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-0 px-4 bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-8 shadow-2xl shadow-slate-900/20 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-50 dark:bg-violet-500/10 rounded-2xl text-violet-600 dark:text-violet-500">
                  <LockKeyhole className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Update Password</h2>
              </div>

              <form onSubmit={handleSubmit(handleUpdatePassword)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Old Password</label>
                  <div className="relative group">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      {...register("oldPassword", { required: true })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all dark:text-white"
                      placeholder="Enter old password"
                    />
                    <div
                      className="absolute inset-y-0 right-1 flex items-center px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      {...register("newPassword", { required: true })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all dark:text-white"
                      placeholder="Enter new password"
                    />
                    <div
                      className="absolute inset-y-0 right-1 flex items-center px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <div
                    onClick={() => setShowPasswordModal(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60"
                  >
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}