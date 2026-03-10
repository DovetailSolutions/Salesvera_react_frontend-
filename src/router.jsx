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

// New, consistent, and relatable icons from Lucide
import { 
  LayoutDashboard, 
  Users, 
  MessageSquareText, 
  UserCheck, 
  CalendarOff, 
  ReceiptText, 
  Building2, 
  Layers, 
  CalendarClock 
} from "lucide-react";

import Category from "./pages/Category";
import Meeting from "./pages/Meeting";
import Profile from "./pages/Profile";
import UserManagement from "./pages/UserManagement";
import ClientBulkUpload from "./pages/ClientBulkUpload";
import Attendance from "./pages/Attendance";
import LeaveApproval from "./pages/LeaveApproval";
import ExpenseManagement from "./pages/ExpenseManagement";
import UserChat from "./pages/UserChat";

export const allRoutes = [
  {
    category: "Analytics",
    routes: [
      {
        path: "/",
        label: "Dashboard",
        icon: <LayoutDashboard className="w-5 h-5" />,
        roles: [ ROLES.ADMIN, ROLES.BASE_ADMIN, ROLES.MANAGER],
      },
    ],
  },
  {
    category: "Menu",
    routes: [
      {
        path: "/user-management",
        label: "User Management",
        icon: <Users className="w-5 h-5" />,
        roles: [ ROLES.ADMIN, ROLES.BASE_ADMIN, ROLES.MANAGER],
      },
      {
        path: "/user-chat",
        label: "Team Chat",
        icon: <MessageSquareText className="w-5 h-5" />,
        roles: [ ROLES.BASE_ADMIN, ROLES.MANAGER],
      },
      {
        path: "/attendance-management",
        label: "Team Attendance",
        icon: <UserCheck className="w-5 h-5" />,
        roles: [ ROLES.BASE_ADMIN, ROLES.MANAGER],
      },
      {
        path: "/leave-requests",
        label: "Leave Management",
        icon: <CalendarOff className="w-5 h-5" />,
        roles: [ ROLES.BASE_ADMIN, ROLES.MANAGER],
      },
      {
        path: "/expense-management",
        label: "Team Expenses",
        icon: <ReceiptText className="w-5 h-5" />,
        roles: [ ROLES.BASE_ADMIN, ROLES.MANAGER],
      },
      // {
      //   path: "/registration",
      //   label: "Register User",
      //   icon: <UserPlus className="w-5 h-5" />,
      //   roles: [ROLES.ADMIN],
      // },
      {
        path: "/client-management",
        label: "Client Management",
        icon: <Building2 className="w-5 h-5" />,
        roles: [ROLES.BASE_ADMIN, ROLES.MANAGER],
      },
      {
        path: "/category",
        label: "Categories",
        icon: <Layers className="w-5 h-5" />,
        roles: [ROLES.BASE_ADMIN, ROLES.MANAGER],
      },
      {
        path: "/meeting-management",
        label: "User Meetings",
        icon: <CalendarClock className="w-5 h-5" />,
        roles: [ROLES.BASE_ADMIN, ROLES.MANAGER],
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
          <Route path="user-management" element={<UserManagement />} />
          <Route path="client-management" element={<ClientBulkUpload />} />
          <Route path="attendance-management" element={<Attendance />} />
          <Route path="leave-requests" element={<LeaveApproval />} />
          <Route path="expense-management" element={<ExpenseManagement />} />
          <Route path="user-chat" element={<UserChat />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute rolesAllowed={[ROLES.ADMIN]} />}>
        <Route path="/admin" element={<AdminPanel />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}