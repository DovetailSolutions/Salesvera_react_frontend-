import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast.jsx";
import { Eye, EyeOff } from "lucide-react";

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
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const [show, setShow] = useState(false);

  const onSubmit = async (data) => {
    try {
      await login(data);
      Toast.success("You have been successfully logged in.");
      navigate("/");
    } catch (e) {
      Toast.error("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-200 py-14"
      >
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold tracking-tight">
            <span className="text-[var(--primary-blue)]">Sales</span>
            <span className="text-[var(--primary-green)]">vera</span>
          </div>
          <p className="mt-2 text-gray-500 text-sm">Sign in to your account</p>
        </div>
        {/* <h2 className="text-2xl font-semibold text-gray-600 mb-6 text-center">Sign In</h2> */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            {...register("email")}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] focus:border-transparent transition"
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              {...register("password")}
              className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] focus:border-transparent transition"
              placeholder="••••••••"
            />
            <div
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 bg-[var(--primary-blue)] hover:bg-blue-600 text-white font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}