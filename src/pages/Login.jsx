import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast.jsx";
import { Eye, EyeOff } from "lucide-react";
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
    formState: { errors, isSubmitting }, // ✅ get isSubmitting
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

  return (
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
              </div>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

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
              </div>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
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
    </div>
  );
}
