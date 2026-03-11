import React, { useEffect, useState, useMemo } from "react";
import Table from "../components/Table";
import { adminApi } from "../api";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router";
import Loader from "../components/Loader";
import { Search, UserPlus, Filter } from "lucide-react"; // Added for UI polish

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          ? fullList.filter(
              (u) =>
                u.firstName?.toLowerCase().includes(searchTrimmed) ||
                u.lastName?.toLowerCase().includes(searchTrimmed) ||
                u.email?.toLowerCase().includes(searchTrimmed) ||
                u.phone?.toLowerCase().includes(searchTrimmed)
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
          filtered = filtered.filter(
            (item) =>
              item.firstName?.toLowerCase().includes(term) ||
              item.lastName?.toLowerCase().includes(term) ||
              item.email?.toLowerCase().includes(term) ||
              item.phone?.toLowerCase().includes(term)
          );
        }
        if (roleFilter !== "all") {
          filtered = filtered.filter((item) => {
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
      { key: "firstName", label: "First Name", render: (row) => <div className="capitalize font-medium text-slate-800">{row.firstName}</div> },
      { key: "lastName", label: "Last Name", render: (row) => <div className="capitalize font-medium text-slate-800">{row.lastName}</div> },
      { key: "email", label: "Email", render: (row) => <div className="break-words max-w-xs text-slate-500">{row.email}</div> },
      { key: "phone", label: "Phone", render: (row) => <div className="text-slate-600">{row.phone}</div> },
      {
        key: "role",
        label: "Role",
        render: (row) => {
          if (row.role === "sale_person") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Salesperson</span>;
          if (row.role === "manager") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Manager</span>;
          if (row.role === "admin" || row.role === "super_admin") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 capitalize">{row.role.replace("_", " ")}</span>;
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
          return name !== "—" ? <span className="font-medium text-slate-700">{name}</span> : <span className="text-slate-400">—</span>;
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
    // Reset to page 1 on new search
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    setRoleFilter(value);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };

  const showRoleFilter = !isManager;

  return (
    <div className="py-4 h-[calc(100vh-6rem)] flex flex-col">
      <Toaster position="top-right" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            {isManager ? "My Sales Team" : isAdmin ? "My Team" : "User Management"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isManager ? "View and manage your assigned sales representatives." : "Manage system users, roles, and permissions."}
          </p>
        </div>
        <div>
          <button
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all px-5 py-2.5 rounded-xl text-sm"
            onClick={() => navigate("/registration")}
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </button>
        </div>
      </div>

      {/* Toolbar / Controls Card */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search Bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={isManager ? "Search team by name, email, phone..." : "Search users by name, email, phone..."}
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filters */}
          {showRoleFilter && (
            <div className="w-full md:w-auto flex items-center gap-3">
              <div className="relative w-full md:w-48">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={handleRoleChange}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  {isSuperAdmin && <option value="admin">Admin</option>}
                  <option value="manager">Manager</option>
                  <option value="sale_person">Salesperson</option>
                </select>
                {/* Custom Select Arrow */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Card container */}
      <div className="relative flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Table Wrapper (Assuming your Table component handles its own scrolling) */}
        <div className="flex-1 overflow-auto custom-scrollbar p-0">
          <Table
            columns={columns}
            data={users}
            actions={actions}
            keyField="id"
            emptyMessage={loading ? "Loading users..." : "No users found matching your criteria"}
            currentPage={pagination.currentPage}
            pageSize={pagination.limit}
            totalCount={pagination.totalItems}
            onPageChange={(page) => setPagination((p) => ({ ...p, currentPage: page }))}
          />
        </div>

        {/* ✅ Overlay loader on top of table — NO LAYOUT SHIFT */}
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-300">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
              <Loader /> 
              <span className="text-sm font-semibold text-slate-600">Syncing data...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}