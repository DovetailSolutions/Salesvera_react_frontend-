// src/pages/UserManagement.jsx
import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import { adminApi } from "../api";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router";

// 👇 Replace with your real auth logic in production
const useAuth = () => {
  const userData = JSON.parse(localStorage.getItem("user"));
  return {
    user: userData || { role: "admin", id: null },
  };
};

export default function UserManagement() {
  const { user } = useAuth();
  const isManager = user.role === "manager";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
    limit: 10,
  });

  const navigate = useNavigate();

  const fetchUsers = async (page = 1, search = "", role = "all") => {
    try {
      setLoading(true);

      if (isManager) {
        try {
          const res = await adminApi.getMySalespersons({
            managerId: user.id,
            page: 1,
          });

          const data = res.data?.data || res.data;
          if (!data || !Array.isArray(data.finalRows)) {
            throw new Error("Invalid response from my salespersons API");
          }

          const term = searchTerm.toLowerCase().trim();
          let filteredRows = data.finalRows;

          if (term) {
            filteredRows = data.finalRows.filter((user) => {
              return (
                (user.firstName && user.firstName.toLowerCase().includes(term)) ||
                (user.lastName && user.lastName.toLowerCase().includes(term)) ||
                (user.email && user.email.toLowerCase().includes(term)) ||
                (user.phone && user.phone.toLowerCase().includes(term))
              );
            });
          }

          // Update state with filtered results (no real pagination)
          setUsers(filteredRows);
          setPagination({
            currentPage: 1,
            totalItems: filteredRows.length,
            totalPages: 1,
            limit: filteredRows.length,
          });
        } catch (err) {
          // Let outer catch handle it
          throw err;
        }
      } else {
        // 🔵 Admin: full filtering
        const params = { page, limit: 10 };
        if (search) params.search = search;
        if (role !== "all") params.role = role;

        const res = await adminApi.getAllUsers(params);
        const data = res.data?.data || res.data;

        if (!data || !Array.isArray(data.finalRows)) {
          throw new Error("Invalid response from all users API");
        }

        setUsers(data.finalRows);
        setPagination({
          currentPage: data.page || page,
          totalItems: data.total || 0,
          totalPages: Math.ceil((data.total || 0) / (data.limit || 10)),
          limit: data.limit || 10,
        });
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to load users");
      setUsers([]);
      setPagination((prev) => ({ ...prev, totalItems: 0, totalPages: 1 }));
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers(1, searchTerm, isManager ? "all" : roleFilter);
  }, [isManager, user.id, searchTerm, roleFilter]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchUsers(1, value, isManager ? "all" : roleFilter);
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    setRoleFilter(value);
    if (!isManager) {
      fetchUsers(1, searchTerm, value);
    }
  };

  const columns = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  {
    key: "role",
    label: "Role",
    render: (row) => {
      if (row.role === "sale_person") return <span>Salesperson</span>;
      if (row.role === "manager") return <span>Manager</span>;
      return <span className="capitalize">{row.role}</span>;
    },
  },
  {
    key: "assignedUnder",
    label: "Assigned Under",
    render: (row) => {
      if (row.creator && (row.creator.firstName || row.creator.lastName)) {
        return (
          <span>
            {row.creator.firstName} {row.creator.lastName}
          </span>
        );
      }
      return <span className="text-gray-400">—</span>;
    },
  },
];

  const actions = [];

  return (
    <div className="py-6">
      <Toaster position="top-right" />

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-4 flex-1 max-w-3xl">
          <input
            type="text"
            placeholder={
              isManager
                ? "Search your salespersons by name, email, or phone..."
                : "Search by name, email or phone number..."
            }
            value={searchTerm}
            onChange={handleSearch}
            className={`px-5 py-2 rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent shadow-sm w-full sm:w-auto flex-1 min-w-[200px] custom-border`}
          />

          {/* Role Filter – admin only */}
          {!isManager && (
            <select
              value={roleFilter}
              onChange={handleRoleChange}
              className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm w-full sm:w-auto"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="sale_person">Salesperson</option>
            </select>
          )}
        </div>

        {/* Add User Button — only for non-managers */}
        {!isManager && (
          <div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white shadow hover:shadow-lg transform hover:-translate-y-0.5 transition px-4 py-2 rounded"
              onClick={() => navigate("/registration")}
            >
              + Add User
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-700">
          {isManager ? "My Sales Team" : "Registered Users"}
        </h2>
      </div>

      <Table
        columns={columns}
        data={users}
        actions={actions}
        keyField="id"
        emptyMessage="No users found"
        currentPage={pagination.currentPage}
        pageSize={pagination.limit}
        totalCount={pagination.totalItems}
        onPageChange={(page) =>
          fetchUsers(page, searchTerm, isManager ? "all" : roleFilter)
        }
      />

      {loading && (
        <div className="text-center mt-4 text-gray-500 text-sm">
          Loading users...
        </div>
      )}
    </div>
  );
}