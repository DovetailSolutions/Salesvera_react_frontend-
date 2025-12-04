import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import { adminApi } from "../api";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router";
import Loader from "../components/Loader";

const useAuth = () => {
  const userData = JSON.parse(localStorage.getItem("user"));
  return {
    user: userData || { role: "admin", id: null, firstName: "", lastName: "" },
  };
};

export default function UserManagement() {
  const { user } = useAuth();
  const isManager = user.role === "manager";
  const isAdmin = user.role === "admin";
  const isSuperAdmin = !isManager && !isAdmin; // only super admin sees "admin" users

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

  const fetchUsers = async (page = 1, search = "") => {
    try {
      setLoading(true);

      if (isManager) {
        // Fetch ALL salespersons (across all pages) since total is small (12)
        let allSalespersons = [];
        let currentPage = 1;
        let totalFetched = 0;
        let totalExpected = 0;

        try {
          // We'll fetch at least one page to get total count
          let firstPageRes = await adminApi.getMySalespersons({ managerId: user.id, page: 1 });
          let firstPageData = firstPageRes.data?.data || firstPageRes.data;
          totalExpected = firstPageData.total || 0;
          const limit = firstPageData.limit || 10;

          if (Array.isArray(firstPageData.rows)) {
            allSalespersons = [...firstPageData.rows];
            totalFetched = firstPageData.rows.length;
          }

          // Fetch remaining pages if needed
          while (totalFetched < totalExpected) {
            currentPage++;
            const nextPageRes = await adminApi.getMySalespersons({ managerId: user.id, page: currentPage });
            const nextPageData = nextPageRes.data?.data || nextPageRes.data;
            const nextRows = Array.isArray(nextPageData?.rows) ? nextPageData.rows : [];
            
            if (nextRows.length === 0) break;

            allSalespersons.push(...nextRows);
            totalFetched += nextRows.length;
          }
        } catch (err) {
          console.error("Failed to fetch all salespersons for manager:", err);
          toast.error("Failed to load full sales team");
          allSalespersons = [];
        }

        // Apply client-side search (if any)
        const term = search.toLowerCase().trim();
        const filtered = term
          ? allSalespersons.filter(u =>
              (u.firstName?.toLowerCase().includes(term)) ||
              (u.lastName?.toLowerCase().includes(term)) ||
              (u.email?.toLowerCase().includes(term)) ||
              (u.phone?.toLowerCase().includes(term))
            )
          : allSalespersons;

        // Paginate the filtered list
        const limit = 10;
        const paginated = paginateArray(filtered, page, limit);

        setUsers(paginated);
        setPagination({
          currentPage: page,
          totalItems: filtered.length,
          totalPages: Math.ceil(filtered.length / limit),
          limit,
        });
      } else if (isAdmin) {
        try {
          const res = await adminApi.getAdminManagers();
          const response = res.data;
          const adminUser = response.data?.user;

          if (!adminUser || !Array.isArray(adminUser.createdUsers)) {
            setUsers([]);
            setPagination({ currentPage: 1, totalItems: 0, totalPages: 1, limit: 10 });
            return;
          }

          const adminName = `${user.firstName} ${user.lastName}`.trim() || "Admin";
          let combinedList = [];

          for (const manager of adminUser.createdUsers) {
            combinedList.push({
              ...manager,
              _type: "manager",
              _assignedName: adminName,
            });

            if (Array.isArray(manager.createdUsers)) {
              for (const sp of manager.createdUsers) {
                combinedList.push({
                  ...sp,
                  _type: "salesperson",
                  _assignedName: `${manager.firstName} ${manager.lastName}`.trim() || "—",
                });
              }
            }
          }

          const term = search.toLowerCase().trim();
          let filtered = combinedList;

          // Apply search filter
          if (term) {
            filtered = filtered.filter((item) =>
              (item.firstName?.toLowerCase().includes(term)) ||
              (item.lastName?.toLowerCase().includes(term)) ||
              (item.email?.toLowerCase().includes(term)) ||
              (item.phone?.toLowerCase().includes(term))
            );
          }

          // Apply role filter
          if (roleFilter !== "all") {
            filtered = filtered.filter(item => {
              if (roleFilter === "manager") return item._type === "manager";
              if (roleFilter === "sale_person") return item._type === "salesperson";
              return true;
            });
          }

          const limit = 10;
          const paginated = paginateArray(filtered, page, limit);

          setUsers(paginated);
          setPagination({
            currentPage: page,
            totalItems: filtered.length,
            totalPages: Math.ceil(filtered.length / limit),
            limit,
          });
        } catch (err) {
          console.error("Failed to fetch admin team:", err);
          toast.error("Failed to load team data");
          setUsers([]);
          setPagination({ currentPage: 1, totalItems: 0, totalPages: 1, limit: 10 });
        }
      } else {
        // Super admin: real server pagination
        const params = { page, limit: 10 };
        if (search) params.search = search;
        if (roleFilter !== "all") params.role = roleFilter;

        const res = await adminApi.getAllUsers(params);
        const data = res.data?.data || res.data;
        const finalRows = Array.isArray(data?.finalRows) ? data.finalRows : [];

        setUsers(finalRows);
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
      setPagination({ currentPage: 1, totalItems: 0, totalPages: 1, limit: 10 });
    } finally {
      setLoading(false);
    }
  };

  const paginateArray = (array, page, limit) => {
    const start = (page - 1) * limit;
    return array.slice(start, start + limit);
  };

  useEffect(() => {
    fetchUsers(pagination.currentPage, searchTerm);
  }, [isManager, isAdmin, user.id, searchTerm, pagination.currentPage, roleFilter]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchUsers(1, value);
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    setRoleFilter(value);
    fetchUsers(1, searchTerm);
  };

  const baseColumns = [
    {
      key: "firstName",
      label: "First Name",
      render: (row) => <div className="capitalize">{row.firstName}</div>,
    },
    {
      key: "lastName",
      label: "Last Name",
      render: (row) => <div className="capitalize">{row.lastName}</div>,
    },
    {
      key: "email",
      label: "Email",
      render: (row) => (
        <div className="break-words max-w-xs">{row.email}</div>
      ),
    },
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
  ];

  const columns = isManager
    ? baseColumns 
    : [
        ...baseColumns,
        {
          key: "assignedUnder",
          label: "Assigned Under",
          render: (row) => {
            let name = "—";

            if (isAdmin) {
              // Admin view: only show for salespersons
              if (row._type === 'salesperson') {
                name = row._assignedName || "—";
              }
            } else {
              // Super admin view: show creator, EXCEPT for admin users
              if (row.creator && row.role !== "admin") {
                name = [row.creator.firstName, row.creator.lastName]
                  .filter(Boolean)
                  .join(" ");
              }
              // If row.role === "admin", leave name as "—"
            }

            return name !== "—" ? <span>{name}</span> : <span className="text-gray-400">—</span>;
          },
        }
      ]; 

  const actions = [];

  // Determine if role filter should be shown
  const showRoleFilter = !isManager;

  return (
    <div className="py-6 h-screen">
      <Toaster position="top-right" />

      <div className="mb-4">
        <h1 className="text-3xl font-semibold">
          {isManager
            ? "My Sales Team"
            : isAdmin
            ? "My Team"
            : "Registered Users"}
        </h1>
      </div>

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
            className={`px-5 py-2 rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent shadow-sm w-full sm:w-auto flex-1 min-w-[200px] custom-border`}
          />

          {/* Role Filter – show for admin and super admin */}
          {showRoleFilter && (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-400">Filter by role: </span>
              <select
                value={roleFilter}
                onChange={handleRoleChange}
                className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm w-full sm:w-auto"
              >
                <option value="all">All Roles</option>
                {isSuperAdmin && <option value="admin">Admin</option>}
                <option value="manager">Manager</option>
                <option value="sale_person">Salesperson</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white shadow hover:shadow-lg transform hover:-translate-y-0.5 transition px-4 py-2 rounded"
            onClick={() => navigate("/registration")}
          >
            + Add User
          </button>
        </div>
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
        onPageChange={(page) => fetchUsers(page, searchTerm)}
      />

      {loading && (
          <Loader />     
      )}
    </div>
  );
}