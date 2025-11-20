import React, { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Briefcase,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { authApi, adminApi } from "../api";
import { useNavigate } from "react-router";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createdBy, setCreatedBy] = useState(null);
  const [managers, setManagers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [selectedManagerId, setSelectedManagerId] = useState("");

  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dob: "",
      password: "",
      role: "",
    },
  });

  // Fetch logged-in user for createdBy
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authApi.getProfile();
        if (res?.data?.data?.id) setCreatedBy(res.data.data.id);
        setUserRole(res.data.data.role);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const onSubmit = async (formData) => {
    if (!selectedRole) {
      alert("Please select a role.");
      return;
    }

    setIsLoading(true);
    try {
      let createdByValue;

      if (selectedRole === "sale_person") {
        if (!selectedManagerId) {
          alert("Please select a manager for the salesperson.");
          setIsLoading(false);
          return;
        }
        // Ensure it's a number if backend expects number
        createdByValue = Number(selectedManagerId);
        if (isNaN(createdByValue)) {
          alert("Invalid manager selected.");
          return;
        }
      } else {
        if (!createdBy) {
          alert("User profile not loaded. Please wait or refresh.");
          setIsLoading(false);
          return;
        }
        createdByValue = createdBy; // this should already be a number
      }

      const payload = {
        ...formData,
        role: selectedRole, // ← critical!
        createdBy: createdByValue,
      };

      const res = await authApi.register(payload);
      if (res.data?.success) {
        alert("Registration successful!");
        reset();
        setSelectedRole("");
        setSelectedManagerId("");
      } else {
        alert(res.data?.message || "Registration failed!");
      }
    } catch (err) {
      console.error(err);
      alert("Registration failed. Please check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await adminApi.getAllUsers({
          role: "manager",
          page: 1,
          limit: 100, // get all managers (adjust if needed)
        });

        // Structure: res.data.data.rows (based on your other code)
        setManagers(res.data?.data?.rows || []);
      } catch (error) {
        console.error("Error fetching managers:", error);
        alert("Failed to load managers. Check console for details.");
      }
    };

    fetchManagers();
  }, []);

  return (
    <div className="py-4">
      <div className="w-full">
        {/* Header */}
       <div className="flex justify-between items-center">
         <div className="text-center mb-1">
          <p className="text-3xl text-start px-4 text">Register A New User</p>
        </div>

        <div className="pr-4">
    <button
      className="bg-blue-600 hover:bg-blue-700 text-white shadow hover:shadow-lg transform hover:-translate-y-0.5 transition px-4 py-2 rounded"
      onClick={() => navigate("/user-management")}
    >
      Go Back
    </button>
  </div>
       </div>

        {/* Form Card */}
        <div className="p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register("firstName", {
                      required: "First name is required",
                    })}
                    className={`w-full pl-10 pr-4 py-3 border ${
                      errors.firstName ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register("lastName", {
                      required: "Last name is required",
                    })}
                    className={`w-full pl-10 pr-4 py-3 border ${
                      errors.lastName ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Doe"
                  />
                </div>
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "Invalid email",
                    },
                  })}
                  className={`w-full pl-10 pr-4 py-3 border ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="john.doe@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone + DOB */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register("phone", {
                      required: "Phone number is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Phone must be 10 digits",
                      },
                    })}
                    className={`w-full pl-10 pr-4 py-3 border ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="9998887777"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* DOB */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    {...register("dob", {
                      required: "Date of birth is required",
                    })}
                    className={`w-full pl-10 pr-4 py-3 border ${
                      errors.dob ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                {errors.dob && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.dob.message}
                  </p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Must be at least 8 characters",
                    },
                    pattern: {
                      value: /^(?=.*[A-Z])(?=.*[!@#$%^&*])/,
                      message: "Must contain uppercase & special character",
                    },
                  })}
                  className={`w-full pl-10 pr-12 py-3 border ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Must be 8+ characters with uppercase and special character
              </p>
            </div>

            {selectedRole === "sale_person" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Under
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={selectedRole === "sale_person"}
                  >
                    <option value="" disabled>
                      Select Manager
                    </option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Role */}
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    const role = e.target.value;
                    setSelectedRole(role);
                    if (role !== "sale_person") setSelectedManagerId("");
                  }}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg"
                >
                  <option value="" disabled>
                    Select your role
                  </option>
                  <option value="sale_person">Sales Person</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                </select>
                {/* ...arrow SVG */}
              </div>
              {/* {selectedRole === "" && (
                <p className="text-red-500 text-xs mt-1">Role is required</p>
              )} */}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
                isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
