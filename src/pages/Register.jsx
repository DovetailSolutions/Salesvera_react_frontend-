import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js"; // assuming same hook handles register too
import { authApi } from "../api/index.js";

// ✅ Validation schema
const schema = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup
    .string()
    .matches(/^[0-9]{10}$/, "Phone must be 10 digits")
    .required("Phone number is required"),
  dob: yup.string().required("Date of birth is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[A-Z])(?=.*[!@#$%^&*])/,
      "Must contain one uppercase and one special character"
    )
    .required("Password is required"),
  role: yup.string().required("Role is required"),
});

export default function Register() {
  const { registerUser } = useAuth(); // add registerUser function in your useAuth hook
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        createdBy: 3, // static for now, can be dynamic later
      };

      await authApi.register(payload);
      alert("Registration successful!");
      navigate("/login");
    } catch (e) {
      console.error(e);
      alert("Registration failed!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-white p-6 rounded shadow"
      >
        <h2 className="text-xl mb-4 font-semibold">Create Account</h2>

        {/* First Name */}
        <div className="mb-3">
          <label className="block text-sm">First Name</label>
          <input
            {...register("firstName")}
            className="w-full border p-2 rounded"
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm">
              {errors.firstName.message}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div className="mb-3">
          <label className="block text-sm">Last Name</label>
          <input
            {...register("lastName")}
            className="w-full border p-2 rounded"
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm">{errors.lastName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="mb-3">
          <label className="block text-sm">Email</label>
          <input
            type="email"
            {...register("email")}
            className="w-full border p-2 rounded"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="mb-3">
          <label className="block text-sm">Phone</label>
          <input
            {...register("phone")}
            className="w-full border p-2 rounded"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm">{errors.phone.message}</p>
          )}
        </div>

        {/* DOB */}
        <div className="mb-3">
          <label className="block text-sm">Date of Birth</label>
          <input
            type="date"
            {...register("dob")}
            className="w-full border p-2 rounded"
          />
          {errors.dob && (
            <p className="text-red-500 text-sm">{errors.dob.message}</p>
          )}
        </div>

        {/* Password */}
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

        {/* Role */}
        <div className="mb-4">
          <label className="block text-sm">Role</label>
          <select
            {...register("role")}
            className="w-full border p-2 rounded bg-white"
          >
            <option value="">Select Role</option>
            <option value="sale_person">Sales Person</option>
            <option value="admin">Admin</option>
          </select>
          {errors.role && (
            <p className="text-red-500 text-sm">{errors.role.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded"
        >
          Register
        </button>

        <p className="text-sm text-center mt-3">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-blue-600 cursor-pointer"
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
}
