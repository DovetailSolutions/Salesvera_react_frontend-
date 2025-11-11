import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import { ROLES } from "./utils/roles";

// Example icons (you can customize or remove if unnecessary)
import { LuLayoutDashboard } from "react-icons/lu";
import { FaRegObjectUngroup } from "react-icons/fa6";
import Register from "./pages/Register";

// 1️⃣ Define all routes (categorized, with icons and role restrictions)
export const allRoutes = [
  {
    category: "Analytics",
    routes: [
      {
        path: "/",
        label: "Dashboard",
        icon: <LuLayoutDashboard />,
        roles: [ROLES.ADMIN, ROLES.USER],
      },
    ],
  },
  {
    category: "Menu",
    routes: [
      {
        path: "/admin",
        label: "Admin Panel",
        icon: <FaRegObjectUngroup />,
        roles: [ROLES.ADMIN],
      },
    ],
  },
];

// 2️⃣ Utility function to get sidebar routes based on role
export const getRoutesForRole = (roleParam) => {
  const stored = localStorage.getItem("roles");
  let roles = [];

  try {
    roles = stored ? JSON.parse(stored) : [];
    if (typeof roles === "string") roles = [roles];
  } catch {
    // if it's not valid JSON, treat it as a simple string
    roles = stored ? [stored] : [];
  }

  const storedRole = roleParam || roles[0] || ROLES.USER;

  return allRoutes.map((section) => ({
    ...section,
    routes: section.routes.filter((r) => r.roles?.includes(storedRole)),
  }));
};

// 3️⃣ Main Router Component
export default function CustomRouter() {
  const routesForSidepanel = getRoutesForRole();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/registration" element={<Register />} />
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout routes={routesForSidepanel} />}>
          <Route index element={<Dashboard />} />
        </Route>
      </Route>

      {/* Role-based Protected Route for Admin */}
      <Route element={<ProtectedRoute rolesAllowed={[ROLES.ADMIN]} />}>
        <Route path="/admin" element={<AdminPanel />} />
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
