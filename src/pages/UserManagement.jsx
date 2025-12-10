import React, { useEffect, useState, useMemo } from "react";
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
  const isSuperAdmin = !isManager && !isAdmin;

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

  // ✅ Cache full sales list for managers
  const [allSalespersonsCache, setAllSalespersonsCache] = useState([]);
  const [lastManagerSearch, setLastManagerSearch] = useState("");

  const navigate = useNavigate();

  useEffect(()=>{
    window.scrollTo(0,0);
  }, [])

  const fetchUsers = async (page = pagination.currentPage, search = "") => {
    // ✅ Only clear data if it's a new semantic query (not just page change)
    // We keep current data visible during load → no flicker
    setLoading(true);

    try {
      if (isManager) {
        const searchTrimmed = search.trim().toLowerCase();
        let fullList = allSalespersonsCache;
        let needsRefetch = fullList.length === 0 || searchTrimmed !== lastManagerSearch;

        if (needsRefetch) {
          // Fetch ALL salespersons once
          let allSalespersons = [];
          let currentPage = pagination.currentPage;
          let totalFetched = 0;
          let totalExpected = 0;

          const firstRes = await adminApi.getMySalespersons({ managerId: user.id, page: 1 });
          const firstData = firstRes.data?.data || firstRes.data;
          totalExpected = firstData.total || 0;
          const rows = Array.isArray(firstData.rows) ? firstData.rows : [];
          allSalespersons = [...rows];
          totalFetched = rows.length;

          while (totalFetched < totalExpected) {
            currentPage++;
            const nextRes = await adminApi.getMySalespersons({ managerId: user.id, page: currentPage });
            const nextData = nextRes.data?.data || nextRes.data;
            const nextRows = Array.isArray(nextData?.rows) ? nextData.rows : [];
            if (nextRows.length === 0) break;
            allSalespersons.push(...nextRows);
            totalFetched += nextRows.length;
          }

          setAllSalespersonsCache(allSalespersons);
          setLastManagerSearch(searchTrimmed);
          fullList = allSalespersons;
        }

        // Client-side filter + paginate
        const filtered = searchTrimmed
          ? fullList.filter(u =>
              (u.firstName?.toLowerCase().includes(searchTrimmed)) ||
              (u.lastName?.toLowerCase().includes(searchTrimmed)) ||
              (u.email?.toLowerCase().includes(searchTrimmed)) ||
              (u.phone?.toLowerCase().includes(searchTrimmed))
            )
          : fullList;

        const limit = 10;
        const paginated = filtered.slice((page - 1) * limit, page * limit);

        setUsers(paginated);
        setPagination({
          currentPage: page,
          totalItems: filtered.length,
          totalPages: Math.ceil(filtered.length / limit),
          limit,
        });
      } else if (isAdmin) {
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
          combinedList.push({ ...manager, _type: "manager", _assignedName: adminName });
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

        let filtered = combinedList;
        const term = search.trim().toLowerCase();
        if (term) {
          filtered = filtered.filter(item =>
            (item.firstName?.toLowerCase().includes(term)) ||
            (item.lastName?.toLowerCase().includes(term)) ||
            (item.email?.toLowerCase().includes(term)) ||
            (item.phone?.toLowerCase().includes(term))
          );
        }
        if (roleFilter !== "all") {
          filtered = filtered.filter(item => {
            if (roleFilter === "manager") return item._type === "manager";
            if (roleFilter === "sale_person") return item._type === "salesperson";
            return true;
          });
        }

        const limit = 10;
        const paginated = filtered.slice((page - 1) * limit, page * limit);
        setUsers(paginated);
        setPagination({
          currentPage: page,
          totalItems: filtered.length,
          totalPages: Math.ceil(filtered.length / limit),
          limit,
        });
      } else {
        // Super admin: real server-side pagination
        const params = { page, limit: 10 };
        if (search) params.search = search.trim();
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

  // ✅ Memoize columns to prevent Table re-renders
  const columns = useMemo(() => {
    const base = [
      { key: "firstName", label: "First Name", render: (row) => <div className="capitalize">{row.firstName}</div> },
      { key: "lastName", label: "Last Name", render: (row) => <div className="capitalize">{row.lastName}</div> },
      { key: "email", label: "Email", render: (row) => <div className="break-words max-w-xs">{row.email}</div> },
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

    if (isManager) return base;

    return [
      ...base,
      {
        key: "assignedUnder",
        label: "Assigned Under",
        render: (row) => {
          let name = "—";
          if (isAdmin) {
            if (row._type === "salesperson") name = row._assignedName || "—";
          } else {
            if (row.creator && row.role !== "admin") {
              name = [row.creator.firstName, row.creator.lastName].filter(Boolean).join(" ");
            }
          }
          return name !== "—" ? <span>{name}</span> : <span className="text-gray-400">—</span>;
        },
      },
    ];
  }, [isManager, isAdmin]);

  // ✅ Memoize actions (even if empty)
  const actions = useMemo(() => [], []);

 useEffect(() => {
  fetchUsers(pagination.currentPage, searchTerm);
}, [isManager, isAdmin, user.id, searchTerm, roleFilter, pagination.currentPage]);

  const handleSearch = (e) => {
  const value = e.target.value;
  setSearchTerm(value);
  setPagination(p => ({ ...p, currentPage: 1 })); // ✅ crucial
};

const handleRoleChange = (e) => {
  const value = e.target.value;
  setRoleFilter(value);
  setPagination(p => ({ ...p, currentPage: 1 })); // ✅ crucial
};

  const showRoleFilter = !isManager;

  return (
    <div className="py-2 h-screen flex flex-col">
      <Toaster position="top-right" />

      <div className="mb-4">
        <h1 className="text-3xl font-semibold">
          {isManager ? "My Sales Team" : isAdmin ? "My Team" : "Registered Users"}
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
            className="px-5 py-2 rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent shadow-sm w-full sm:w-auto flex-1 min-w-[200px] custom-border"
          />

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

      {/* ✅ Overlay loader on top of table — NO LAYOUT SHIFT */}
      <div className="relative flex-1">
        <Table
          columns={columns}
          data={users}
          actions={actions}
          keyField="id"
          emptyMessage={loading ? "Loading..." : "No users found"}
          currentPage={pagination.currentPage}
          pageSize={pagination.limit}
          totalCount={pagination.totalItems}
          onPageChange={(page) => setPagination(p => ({ ...p, currentPage: page }))}
        />

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded">
            <Loader />
          </div>
        )}
      </div>
    </div>
  );
}