import React, { useEffect, useState, useMemo } from "react";
import Table from "../components/Table";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router";
import Loader from "../components/Loader";
import { Search, UserPlus, Filter, MapPin } from "lucide-react";
import FuelExpensesView from "../components/FuelManagement";
import { adminApi } from "../api";

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

  const allroles = localStorage.getItem("roles", JSON.stringify(user.role)); // Ensure role is stored for route access control

  // Fuel Expenses Navigation State
  const [selectedUserForExpenses, setSelectedUserForExpenses] = useState(null);

  const [allSalespersonsCache, setAllSalespersonsCache] = useState([]);
  const [lastManagerSearch, setLastManagerSearch] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedUserForExpenses]);

  const fetchUsers = async (page = pagination.currentPage, search = "") => {
    setLoading(true);
    try {
      if (isManager) {
        const searchTrimmed = search.trim().toLowerCase();
        let fullList = allSalespersonsCache;
        let needsRefetch = fullList.length === 0 || searchTrimmed !== lastManagerSearch;

        if (needsRefetch) {
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

  const columns = useMemo(() => {
    const base = [
      { key: "firstName", label: "First Name", render: (row) => <div className="capitalize font-medium text">{row.firstName}</div> },
      { key: "lastName", label: "Last Name", render: (row) => <div className="capitalize font-medium text">{row.lastName}</div> },
      { key: "email", label: "Email", render: (row) => <div className="break-words max-w-xs text">{row.email}</div> },
      { key: "phone", label: "Phone", render: (row) => <div className="text">{row.phone}</div> },
      {
        key: "role",
        label: "Role",
        render: (row) => {
          if (row.role === "sale_person" || row._type === "salesperson") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Salesperson</span>;
          if (row.role === "manager" || row._type === "manager") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Manager</span>;
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
          return name !== "—" ? <span className="font-medium text">{name}</span> : <span className="text">—</span>;
        },
      },
    ];
  }, [isManager, isAdmin]);

  // Updated Actions to use the standard Table menu dropdown
  const actions = useMemo(() => [
    {
      type: "menu",
      label: "Actions",
      className: "p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
      menuItems: [
        {
          label: (
            <span className="flex items-center gap-2 font-medium text-blue-600 dark:text-blue-400">
              <MapPin className="w-4 h-4" /> Fuel Expenses
            </span>
          ),
          onClick: (row) => setSelectedUserForExpenses(row),
          condition: (row) => row.role === "sale_person" || row._type === "salesperson",
          className: "hover:!bg-blue-50 dark:hover:!bg-blue-500/10 cursor-pointer",
        }
      ]
    }
  ], []);

  useEffect(() => {
    if (!selectedUserForExpenses) {
      fetchUsers(pagination.currentPage, searchTerm);
    }
  }, [isManager, isAdmin, user.id, searchTerm, roleFilter, pagination.currentPage, selectedUserForExpenses]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };

  const showRoleFilter = !isManager;

  // Conditionally render the Fuel Expenses View
  if (selectedUserForExpenses) {
    return (
      <FuelExpensesView
        user={selectedUserForExpenses}
        onBack={() => setSelectedUserForExpenses(null)}
      />
    );
  }

  return (
    <div className="py-4 flex flex-col w-full">
      <Toaster position="top-right" />

      <div className="translucent mb-6 z-10">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">

            <input
              type="text"
              placeholder={isManager ? "Search team by name, email, phone..." : "Search users by name, email, phone..."}
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all translucent-inner"
            />
          </div>

          {showRoleFilter && (
            <div className="w-full md:w-auto flex items-center gap-3">
              <div className="relative w-full md:w-48">

                <select
                  value={roleFilter}
                  onChange={handleRoleChange}
                  className="translucent-inner w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  {isSuperAdmin && <option value="admin">Admin</option>}
                  <option value="manager">Manager</option>
                  <option value="sale_person">Salesperson</option>
                </select>


                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>


              </div>
              <div>
                <button
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all px-5 py-2.5 rounded-xl text-sm"
                  onClick={() => navigate(allroles === "super_admin" ? "/registration" : "/user-registration")}
                >
                  <UserPlus className="w-4 h-4" />
                  Add New User
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden flex flex-col translucent">
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

        {loading && (
          <Loader />
        )}
      </div>
    </div>
  );
}