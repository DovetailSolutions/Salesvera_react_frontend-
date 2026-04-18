import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast.jsx";
import { Eye, EyeOff, Mail, LockKeyhole, ArrowRight } from "lucide-react";

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const [show, setShow] = useState(false);

  // 🌗 Auto detect system theme
  useEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const onSubmit = async (data) => {
    try {
      await login(data);
      Toast.success("You have been successfully logged in.");
      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 1000);
    } catch (e) {
      Toast.error("Login failed. Please check your credentials.");
    }
  };

  // Glassmorphism-style input class
  const inputClass = (error) => `w-full pl-11 pr-10 py-3 
    bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm
    border ${error
      ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
      : "border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500"
    } 
    rounded-xl text-sm 
    text-slate-800 dark:text-white 
    placeholder-slate-400 dark:placeholder-slate-500
    focus:bg-white dark:focus:bg-slate-800 
    focus:outline-none focus:ring-4 
    transition-all duration-200`;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 px-4 py-10 font-sans selection:bg-blue-500 selection:text-white">

      {/* Blurred Background Orbs */}
      <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/15 dark:bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 h-64 w-64 rounded-full bg-violet-500/15 dark:bg-violet-500/10 blur-3xl pointer-events-none" />

      {/* Glass Panel */}
      <div className="relative z-10 w-full max-w-md p-8 md:p-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-white dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500">

        {/* Header Section */}
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-500">
            SalesVera Admin
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-800 dark:text-white">
            Welcome to SalesVera
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
            A polished command center for revenue, team operations, and client visibility.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

          {/* Email Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                {...register("email")}
                disabled={isSubmitting}
                className={inputClass(errors.email)}
                placeholder="name@salesvera.io"
              />
            </div>
            {errors.email && (
              <p className="text-xs font-medium text-red-500 mt-1.5">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <div className="relative">
              <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type={show ? "text" : "password"}
                {...register("password")}
                disabled={isSubmitting}
                className={inputClass(errors.password)}
                placeholder="Enter your password"
              />
              <div
                type="div"
                className="absolute inset-y-0 right-1 flex items-center px-3 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 transition-colors"
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-red-500 mt-1.5">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Optional Utilities */}
          <div className="flex items-center justify-between pt-1 pb-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 transition-colors"
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                Remember me
              </span>
            </label>
            <div
              type="div"
              className="text-sm font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
            >
              Forgot password?
            </div>
          </div>

          {/* Submit div */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${isSubmitting
              ? "bg-blue-400 cursor-not-allowed shadow-none text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:ring-4 focus:ring-blue-500/30 active:translate-y-0"
              }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Login
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}