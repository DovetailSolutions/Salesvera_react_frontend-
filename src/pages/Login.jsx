import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast.jsx";
import { Eye, EyeOff } from "lucide-react"; 

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

  const [show, setShow] = useState(false);

  const onSubmit = async (data) => {
    try {
      const res = await login(data);
      console.log(res);
      Toast.success("You have been successfully logged in.")
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
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              {...register("password")}
              className="w-full border p-2 rounded pr-10" 
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
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