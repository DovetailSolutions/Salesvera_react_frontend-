import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast.jsx";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import loginbg from "../assets/loginui.jpg";

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

  // Common Input styling matching the Register component
  const inputClass = (error) => `w-full pl-11 pr-4 py-3 bg-slate-50 border ${
    error ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
  } rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200`;

  return (
<<<<<<< HEAD
    <div className="min-h-screen flex w-full bg-slate-50 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Left Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
        
        <div className="w-full max-w-[500px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Form Card */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            
            <div className="text-center mb-8">
              {/* Brand Logo added for context */}
              <div className="text-3xl font-bold mb-6 tracking-tight select-none">
                <span className="logo-font text-blue-500">Sales</span>
                <span className="logo-font text-green-500">vera</span>
=======
    <div className="h-screen flex items-center justify-center">
      <div className="w-full h-full flex justify-center items-center">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md bg-white p-8 rounded-xl py-14"
        >
          <div className="text-center mb-8">

            <div className="text-3xl">
              <p className="text-(--primary-blue)">Sharper control.</p>
              <p className="text-(--primary-green)">Smarter sales.</p>
            </div>
             
            <p className="mt-2 text-gray-500 text-3xl font-semibold">
              Sign in to your account
            </p>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              {...register("email")}
              disabled={isSubmitting} // optional: disable during submit
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] focus:border-transparent transition"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                {...register("password")}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] focus:border-transparent transition"
                placeholder="••••••••"
              />
              <div
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 cursor-pointer"
                onClick={() => setShow(!show)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
>>>>>>> e6b9a062c96a4374ec0e06143c66a98bdb2c19b2
              </div>
              
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">Welcome back</h1>
              <p className="text-slate-500 text-sm font-medium">
                Please enter your details to sign in
              </p>
            </div>

<<<<<<< HEAD
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    {...register("email")}
                    disabled={isSubmitting}
                    className={inputClass(errors.email)}
                    placeholder="name@company.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">
                    {errors.email.message}
                  </p>
                )}
=======
          <button
            type="submit"
            disabled={isSubmitting} // ✅ disable while submitting
            className={`!w-full py-2.5 px-4 font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[var(--primary-blue)] hover:bg-blue-600 text-white focus:ring-blue-500"
            }`}
          >
            {isSubmitting ? (
              <div className="flex gap-2 items-center justify-center">
                <span className="flex items-center justify-center">
                  Signing in...
                </span>
                <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
>>>>>>> e6b9a062c96a4374ec0e06143c66a98bdb2c19b2
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  {/* Optional: Add a 'Forgot Password?' link here in the future */}
                  {/* <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">Forgot password?</a> */}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={show ? "text" : "password"}
                    {...register("password")}
                    disabled={isSubmitting}
                    className={`${inputClass(errors.password)} pr-11`}
                    placeholder="••••••••"
                  />
                  <div
                    type="div"
                    className="absolute inset-y-0 right-1 flex items-center px-3 text-slate-400 hover:text-blue-600 focus:outline-none transition-colors"
                    onClick={() => setShow(!show)}
                    aria-label={show ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit div */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 px-4 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? "bg-blue-400 cursor-not-allowed shadow-none text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:ring-4 focus:ring-blue-500/30 active:translate-y-0"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </form>

          </div>
          
          {/* Footer Text */}
          <p className="text-center text-xs text-slate-400 mt-8 font-medium">
            © {new Date().getFullYear()} Salesvera. All rights reserved.
          </p>
        </div>
      </div>
<<<<<<< HEAD

      {/* Right Image Section (Hidden on mobile/tablet) */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-900 overflow-hidden">
        {/* Subtle dark gradient overlay to make the image look premium and ensure it isn't distracting */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent z-10 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-blue-900/20 z-10 mix-blend-overlay"></div>
        
        <div
          style={{ backgroundImage: `url(${loginbg})` }}
          className="absolute inset-0 bg-cover bg-no-repeat bg-center transition-transform duration-10000 hover:scale-105"
        ></div>
        
        {/* Optional: Add some overlay text or branding on the image side if desired */}
        <div className="absolute bottom-12 left-12 right-12 z-20 text-white">
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Streamline your sales process.</h2>
          <p className="text-slate-200 text-lg max-w-md font-medium">
            Manage your team, track performance, and close deals faster with our comprehensive CRM platform.
          </p>
        </div>
      </div>

=======
      <div
        style={{ backgroundImage: `url(${loginbg})` }}
        className="w-full h-full flex flex-col justify-between items-center bg-cover bg-no-repeat bg-center py-20"
      >
        <div className="text-7xl font-extrabold tracking-tight">
              <span className="text-[var(--primary-blue)]">Sales</span>
              <span className="text-[var(--primary-green)]">vera</span>
            </div>

            <div className="text-white flex flex-col justify-center items-center">
              <p className="text-xl">Insights. Analytics.</p>
              <p className="text-3xl">Overwiew.</p>
            </div>
      </div>
>>>>>>> e6b9a062c96a4374ec0e06143c66a98bdb2c19b2
    </div>
  );
}