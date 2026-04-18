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
  CalendarClock,
  ReceiptTextIcon,
  UserPlus,
  ReceiptIcon
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
import Quotations from "./pages/Quotations";
import FuelManagement from "./components/FuelManagement";
import NewUser from "./pages/NewUser";
import UserRegistration from "./pages/UserRegistration";
import QuotationList from "./pages/QuotationList";
import path from "node:path";
import InvoiceList from "./pages/invoice/InvoiceList";
import GetSaleRecord from "./pages/GetSaleRecord";
import { TbTransactionRupee } from "react-icons/tb";
import MainInvoice from "./pages/invoice/MainInvoice";
import CurrentOutstanding from "./pages/CurrentOutstanding";

export const allRoutes = [
  {
    category: "Analytics",
    routes: [
      {
        path: "/",
        label: "Dashboard",
        icon: <LayoutDashboard className="w-5 h-5" />,
        roles: [ROLES.ADMIN, ROLES.BASE_ADMIN, ROLES.MANAGER],
        subtitle: "Here's a live view of your revenue and operations.",
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
        roles: [ROLES.ADMIN, ROLES.BASE_ADMIN, ROLES.MANAGER],
        subtitle: "Manage team members and user roles.",
      },
      {
        path: "/user-chat",
        label: "Team Chat",
        icon: <MessageSquareText className="w-5 h-5" />,
        roles: [ROLES.BASE_ADMIN, ROLES.MANAGER],
        subtitle: "Real-time messaging for your team.",
      },
      {
        path: "/user-registration",
        label: "Register User",
        icon: <UserPlus className="w-5 h-5" />,
        subtitle: "Add new team members to the system.",
        roles: [ROLES.ADMIN],
      },


      {
        path: "/client-management",
        label: "Client Management",
        icon: <Building2 className="w-5 h-5" />,
        roles: [ROLES.BASE_ADMIN, ROLES.MANAGER],
        subtitle: "Manage client information and details.",
      },
      {
        label: "HRMS",
        icon: <ReceiptIcon className="w-5 h-5" />,
        subRoutes: [
          {
            path: "/attendance-management",
            label: "Team Attendance",
            icon: <UserCheck className="w-5 h-5" />,
            roles: [ROLES.BASE_ADMIN, ROLES.MANAGER],
            subtitle: "Track team attendance and leaves.",
          },
          {
            path: "/leave-requests",
            label: "Leave Management",
            icon: <CalendarOff className="w-5 h-5" />,
            roles: [ROLES.BASE_ADMIN, ROLES.MANAGER],
            subtitle: "Approve or reject leave requests.",
          },
        ]
      },

      {
        label: "Financial Insights",
        icon: <ReceiptIcon className="w-5 h-5" />,
        subRoutes: [
          {
            path: "/current-outstanding",
            label: "Current Outstanding",
            icon: <Layers className="w-5 h-5" />,
            roles: [ROLES.BASE_ADMIN, ROLES.MANAGER, ROLES.ADMIN],
            subtitle: "View your current outstanding balance.",
          },
          {
            path: "/sale-records",
            label: "Sale Records",
            icon: <TbTransactionRupee className="w-5 h-5" />,
            roles: [ROLES.BASE_ADMIN],
            subtitle: "Manage all the sales records.",
          },
          {
            path: "/expense-management",
            label: "Team Expenses",
            icon: <ReceiptText className="w-5 h-5" />,
            roles: [ROLES.BASE_ADMIN, ROLES.MANAGER],
            subtitle: "Track team expenses and reimbursements.",
          },
        ]
      },

      // 👇 NEW: Expandable Invoices Section
      {
        label: "Invoices & Quotes",
        icon: <ReceiptIcon className="w-5 h-5" />,
        subRoutes: [
          {
            path: "/quotation-list",
            label: "Quotation List",
            icon: <ReceiptText className="w-5 h-5" />,
            roles: [ROLES.ADMIN, ROLES.BASE_ADMIN, ROLES.MANAGER],
            subtitle: "View and download generated PDFs.",
          },

          {
            path: "/performa-invoice",
            label: "Performa Invoice",
            icon: <ReceiptIcon className="w-5 h-5" />,
            roles: [ROLES.BASE_ADMIN, ROLES.MANAGER],
            subtitle: "Manage performa invoices and payments.",
          },
          {
            path: "/invoice-management",
            label: "Invoice Management",
            icon: <ReceiptIcon className="w-5 h-5" />,
            roles: [ROLES.BASE_ADMIN, ROLES.MANAGER],
            subtitle: "Manage performa invoices and payments.",
          },
        ]
      },

      {
        path: "/category",
        label: "Categories",
        icon: <Layers className="w-5 h-5" />,
        roles: [ROLES.BASE_ADMIN, ROLES.MANAGER],
        subtitle: "Manage product categories.",
      },
      {
        path: "/meeting-management",
        label: "User Meetings",
        icon: <CalendarClock className="w-5 h-5" />,
        roles: [ROLES.BASE_ADMIN, ROLES.MANAGER],
        subtitle: "Schedule and track team meetings.",
      },
    ],
  },
];

// Updated to filter subRoutes correctly
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
    routes: section.routes.map(r => {
      // If the route has subRoutes, filter them based on role
      if (r.subRoutes) {
        return {
          ...r,
          subRoutes: r.subRoutes.filter(sub => sub.roles?.includes(storedRole))
        };
      }
      return r;
      // Filter out top-level routes without access, and filter out empty submenus
    }).filter(r => r.subRoutes ? r.subRoutes.length > 0 : r.roles?.includes(storedRole)),
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
          <Route path="new-user" element={<NewUser />} />
          <Route path="category" element={<Category />} />
          <Route path="meeting-management" element={<Meeting />} />
          <Route path="performa-invoice" element={<InvoiceList />} />
          <Route path="profile" element={<Profile />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="client-management" element={<ClientBulkUpload />} />
          <Route path="invoice-management" element={<MainInvoice />} />
          <Route path="sale-records" element={<GetSaleRecord />} />
          <Route path="attendance-management" element={<Attendance />} />
          <Route path="leave-requests" element={<LeaveApproval />} />
          <Route path="expense-management" element={<ExpenseManagement />} />
          <Route path="quotation-management" element={<Quotations />} />
          <Route path="quotation-list" element={<QuotationList />} />
          <Route path="user-chat" element={<UserChat />} />
          <Route path="user-registration" element={<UserRegistration />} />
          <Route path="fuel-management" element={<FuelManagement />} />
          <Route path="current-outstanding" element={<CurrentOutstanding />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute rolesAllowed={[ROLES.ADMIN]} />}>
        <Route path="/admin" element={<AdminPanel />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}