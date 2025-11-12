import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import { ROLES } from "./utils/roles";
import { LuLayoutDashboard } from "react-icons/lu";
import { FaRegObjectUngroup } from "react-icons/fa6";
import { TiUserAddOutline } from "react-icons/ti";
import Category from "./pages/Category";
import { BiCategory } from "react-icons/bi";
import { MdMeetingRoom } from "react-icons/md";
import { RiGroup3Line } from "react-icons/ri";
import Meeting from "./pages/Meeting";
import Profile from "./pages/Profile";

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
        path: "/registration",
        label: "Register User",
        icon: <TiUserAddOutline />,
        roles: [ROLES.ADMIN],
      },
      {
        path: "/category",
        label: "Categories",
        icon: <BiCategory />,
        roles: [ROLES.ADMIN],
      },
      {
        path: "/meeting-management",
        label: "Meetings",
        icon: <RiGroup3Line />,
        roles: [ROLES.ADMIN],
      },
    ],
  },
];

export const getRoutesForRole = (roleParam) => {
  const stored = localStorage.getItem("roles");
  let role;

  try {
    const parsed = stored ? JSON.parse(stored) : null;
    if (Array.isArray(parsed)) {
      role = parsed[0];
    } else if (typeof parsed === "string") {
      role = parsed;
    } else {
      role = stored;
    }
  } catch {
    role = stored || ROLES.ADMIN;
  }

  const storedRole = roleParam || role || ROLES.ADMIN;

  return allRoutes.map((section) => ({
    ...section,
    routes: section.routes.filter((r) => r.roles?.includes(storedRole)),
  }));
};

export default function Router() {
  const routesForSidepanel = getRoutesForRole();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout routes={routesForSidepanel} />}>
          <Route index element={<Dashboard />} />
          <Route path="registration" element={<Register />} />
          <Route path="category" element={<Category />} />
          <Route path="meeting-management" element={<Meeting />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute rolesAllowed={[ROLES.ADMIN]} />}>
        <Route path="/admin" element={<AdminPanel />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
