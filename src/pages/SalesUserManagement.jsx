// src/pages/SalesUserManagement.jsx
import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import { adminApi } from "../api";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function SalesUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
    limit: 10,
  });

  const navigate = useNavigate();

  const fetchUsers = async (page, search) => {
    try {
      setLoading(true);
      const finalPage = page || 1;
      const finalSearch = search !== undefined ? search : searchTerm;

      // ✅ Fetch ONLY salespersons using role=sale_person
      const res = await adminApi.getAllUsers({
        page: finalPage,
        search: finalSearch,
        limit: 10,
        role: "sale_person", // 🔑 Must be "sale_person" (with underscore)
      });

      const data = res.data?.data || res.data;

      if (!data || !Array.isArray(data.rows)) {
        throw new Error("Invalid response format");
      }

      const rows = data.rows;
      const total = data.total || 0;
      const limit = data.limit || 10;
      const currentPage = data.page || finalPage;

      setUsers(rows);
      setPagination({
        currentPage,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        limit,
      });
    } catch (err) {
      console.error("Failed to fetch sales users:", err);
      toast.error("Failed to load sales team");
      setUsers([]);
      setPagination((prev) => ({
        ...prev,
        totalItems: 0,
        totalPages: 1,
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, "");
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchUsers(1, value);
  };

  const columns = [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    // Optional: You can REMOVE the Role column since all are salespersons
    {
      key: "role",
      label: "Role",
      render: () => <span className="capitalize">Salesperson</span>,
    },
  ];

  const actions = []; // Add "View Details", "Deactivate", etc. later if needed

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      <h1 className="text-3xl font-bold text-gray-800 mb-6">Sales Team Management</h1>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="w-full md:w-auto max-w-md">
          <input
            type="text"
            placeholder="Search sales users by name, email, or phone..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-5 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent shadow-sm"
          />
        </div>

        <button
          onClick={() => navigate("/registration")}
          className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 hover:shadow-md transition-all whitespace-nowrap"
        >
          + Add Sales User
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Active Sales Representatives</h2>
      </div>

      <Table
        columns={columns}
        data={users}
        actions={actions}
        keyField="id"
        emptyMessage="No sales users found"
        currentPage={pagination.currentPage}
        pageSize={pagination.limit}
        totalCount={pagination.totalItems}
        onPageChange={(page) => fetchUsers(page, searchTerm)}
      />

      {loading && (
        <div className="text-center mt-4 text-gray-500 text-sm">
          Loading sales team...
        </div>
      )}
    </div>
  );
}