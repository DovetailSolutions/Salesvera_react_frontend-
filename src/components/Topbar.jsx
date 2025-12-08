import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, ChevronDown, Eye, EyeOff } from "lucide-react";
import { TiUserOutline } from "react-icons/ti";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { adminApi } from "../api"; // ⬅️ adjust path if needed
import { useContext } from "react";
import { AuthContext } from "../context/AuthProvider";
import Toast from "./Toast";
import { FaUser } from "react-icons/fa";

export default function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  // ✅ Password form
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const handleUpdatePassword = async (data) => {
    try {
      const res = await adminApi.updatePassword({
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

  return (
    <div className="border-1 border-gray-200 rounded-b-xl p-2 sticky top-0 bg-white z-50">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between px-4 py-2 bg-white sticky top-2 z-50">
        <div className="flex items-center bg-gray-50 rounded-full px-3 py-2 w-64 shadow-inner">
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm flex-1 text-gray-600 placeholder-gray-400 noborder"
          />
          <Search className="w-4 h-4 text-gray-400" />
        </div>

        {/* 👤 Right Icons */}
        <div className="flex items-center gap-3">
          {/* Notification Button */}
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200">
            <Bell className="w-4 h-4 text-gray-600" />
            <span className="absolute top-2 right-2 block w-2 h-2 bg-red-500 rounded-full"></span>
          </div>

          {/* User Dropdown */}
          <div className="relative" ref={menuRef}>
            <div
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center border-1 border-gray-200 hover:bg-gray-200 rounded-full pl-1 pr-2 py-2 cursor-pointer focus:outline-none h-[2.5rem]"
            >
              <div className="p-2 bg-gray-200 rounded-full"><FaUser className="text-2xl text-gray-300 h-4 w-4 font-thin" /></div>
              <ChevronDown
                className={`w-4 h-4 text-gray-600 ml-1 transition-transform duration-200 ${
                  menuOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-44 layout custom-border rounded shadow-lg py-2 z-50"
                >
                  <div
                    onClick={() => {
                      navigate("/profile");
                      setMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    View Profile
                  </div>
                  <div
                    onClick={() => {
                      setShowPasswordModal(true);
                      setMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Update Password
                  </div>

                  <div
                    onClick={async () => {
                      await logout();
                      navigate("/login");
                      Toast.success("You have been successfully signed out.")
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
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
            className="fixed inset-0 flex items-center justify-center theblur z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded w-full max-w-sm p-6 custom-border"
            >
              <div className="py-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Update Password
              </h2>

              <form
                onSubmit={handleSubmit(handleUpdatePassword)}
                className="space-y-3"
              >

                <div className="relative">
  <label className="block text-sm text-gray-600 mb-1">
    Old Password
  </label>
  <div className="relative">
    <input
      type={showOldPassword ? "text" : "password"}
      {...register("oldPassword", { required: true })}
      className="w-full border border-gray-300 rounded px-3 py-2 pl-3 pr-10 focus:ring focus:ring-blue-200 outline-none"
      placeholder="Enter old password"
    />
    <div
      type="button"
      className="absolute inset-y-0 right-4 flex items-center"
      onClick={() => setShowOldPassword(!showOldPassword)}
    >
      {showOldPassword ? (
        <EyeOff className="text-gray-500 hover:text-gray-700" size={18} />
      ) : (
        <Eye className="text-gray-500 hover:text-gray-700" size={18} />
      )}
    </div>
  </div>
</div>

<div className="relative">
  <label className="block text-sm text-gray-600 mb-1">
    New Password
  </label>
  <div className="relative">
    <input
      type={showNewPassword ? "text" : "password"}
      {...register("newPassword", { required: true })}
      className="w-full border border-gray-300 rounded px-3 py-2 pl-3 pr-10 focus:ring focus:ring-blue-200 outline-none"
      placeholder="Enter new password"
    />
    <div
      type="button"
      className="absolute inset-y-0 right-4 flex items-center"
      onClick={() => setShowNewPassword(!showNewPassword)}
    >
      {showNewPassword ? (
        <EyeOff className="text-gray-500 hover:text-gray-700" size={18} />
      ) : (
        <Eye className="text-gray-500 hover:text-gray-700" size={18} />
      )}
    </div>
  </div>
</div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isSubmitting ? "Updating..." : "Update"}
                  </button>
                </div>
              </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
