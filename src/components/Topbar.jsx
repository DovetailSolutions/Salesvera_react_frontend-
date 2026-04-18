import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, Menu, Eye, EyeOff, Moon, Sun, Settings2, LockKeyhole } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { adminApi } from "../api";
import { AuthContext } from "../context/AuthProvider";
import { ThemeContext } from "../context/ThemeProvider";

export default function Topbar({ onOpenSidebar, routes = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  // Dynamic Route Meta (fallback logic if you don't have this centrally)
  const headerMeta = useMemo(() => {
    const defaultMeta = { title: "Dashboard", subtitle: "Here's a live view of your revenue and operations." };
    const flatRoutes = routes.flatMap((section) => section.routes || []);
    const activeRoute = flatRoutes.find((r) => r.path === location.pathname);

    if (activeRoute) {
      return {
        title: activeRoute.label,
        subtitle: activeRoute.subtitle,
        icon: activeRoute.icon,
      };
    }

    // Fallbacks for routes that aren't in the sidebar array (like Profile, or dynamic IDs)
    if (location.pathname.includes("profile")) {
      return { title: "Profile Settings", subtitle: "Manage your personal account details." };
    }

    // Default fallback
    return { title: "Overview", subtitle: "Manage your operations here." };
  }, [location.pathname, routes]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const handleUpdatePassword = async (data) => {
    try {
      await adminApi.updatePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password updated successfully!");
      setShowPasswordModal(false);
      reset();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update password");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

        {/* Dynamic Route Icon (Hidden on mobile to save space, visible on large screens) */}
        {headerMeta.icon && (
          <div className="hidden lg:flex mt-1 h-12 w-12 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-500 shadow-sm">
            {headerMeta.icon}
          </div>
        )}

        {/* Dynamic Title and Subtitle */}
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {headerMeta.title}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
            {headerMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Search, Utilities & User Profile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative group sm:w-72">
          <input
            type="text"
            placeholder="Search dashboard..."
            className="w-full translucent-inner pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all shadow-sm"
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2.5 block w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </div>

          <div onClick={toggleTheme} className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm hidden sm:flex">
            <Settings2 className="h-4 w-4" />
          </div>

          {/* User Profile Pill & Dropdown */}
          <div className="relative" ref={menuRef}>
            <div
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex  items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 cursor-pointer hover:shadow-md transition-all shadow-sm select-none"
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
                  className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 py-2 z-0 overflow-hidden"
                >
                  <div
                    onClick={() => {
                      navigate("/profile");
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    View Profile
                  </div>
                  <div
                    onClick={() => {
                      setShowPasswordModal(true);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    Update Password
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                  <div
                    onClick={async () => {
                      await logout();
                      navigate("/login");
                      toast.success("You have been successfully signed out.");
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    Logout
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 🔒 Update Password Modal */}
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
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Update Password
                </h2>
              </div>

              <form onSubmit={handleSubmit(handleUpdatePassword)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Old Password
                  </label>
                  <div className="relative group">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      {...register("oldPassword", { required: true })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all dark:text-white"
                      placeholder="Enter old password"
                    />
                    <div
                      type="div"
                      className="absolute inset-y-0 right-1 flex items-center px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      {...register("newPassword", { required: true })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all dark:text-white"
                      placeholder="Enter new password"
                    />
                    <div
                      type="div"
                      className="absolute inset-y-0 right-1 flex items-center px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <div
                    type="div"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </div>
                  <div
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}