import React from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

// Default toast options
const defaultOptions = {
  position: "top-right",
  autoClose: 2000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
};

const icons = {
  success: <FaCheckCircle />,
  error: <FaExclamationCircle />,
  info: <FaInfoCircle />,
  warn: <FaExclamationTriangle />,
};

const toastStyle = {
  success: { background: "#9ddf9d", color: "#2d912e" },
  error: { background: "#ef9a9a", color: "#b71c1c" },
  info: { background: "#81d4fa", color: "#0277bd" },
  warn: { background: "#ffc107", color: "#212529" },
};

// Utility to show toast only once
const showUniqueToast = (type, msg, options = {}) => {
  const id = `toast-${type}-${msg}`; // unique ID based on type + message
  if (!toast.isActive(id)) {
    toast[type](msg, {
      ...defaultOptions,
      ...options,
      icon: icons[type],
      style: toastStyle[type],
      toastId: id, // ensures no duplicates
    });
  }
};

const Toast = {
  success: (msg, options = {}) => showUniqueToast("success", msg, options),
  error: (msg, options = {}) => showUniqueToast("error", msg, options),
  info: (msg, options = {}) => showUniqueToast("info", msg, options),
  warn: (msg, options = {}) => showUniqueToast("warn", msg, options),

  fromResponse: (response, options = {}) => {
    if (!response) return;
    const { status, message } = response;
    switch (status) {
      case "success":
        return Toast.success(message || "Success", options);
      case "error":
        return Toast.error(message || "Error", options);
      case "info":
        return Toast.info(message || "Info", options);
      case "warn":
        return Toast.warn(message || "Warning", options);
      default:
        return Toast.info(message || "Notice", options);
    }
  },
};

export default Toast;
