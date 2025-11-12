import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";

const schema = yup.object({
  email: yup.string().required("email required"),
  password: yup.string().required("Password required"),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
     const res = await login(data);
     console.log(res);
     
      navigate("/");
    } catch (e) {
      alert("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-white p-6 rounded shadow"
      >
        <h2 className="text-xl mb-4">Sign in</h2>
        <div className="mb-3">
          <label className="block text-sm">email</label>
          <input
            {...register("email")}
            className="w-full border p-2 rounded"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>
        <div className="mb-3">
          <label className="block text-sm">Password</label>
          <input
            type="password"
            {...register("password")}
            className="w-full border p-2 rounded"
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>
        <button className="w-full py-2 bg-blue-600 text-white rounded">
          Sign in
        </button>
      </form>
    </div>
  );
}
