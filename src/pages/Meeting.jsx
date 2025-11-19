import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import Toast from "../components/Toast";
import { FaSearch } from "react-icons/fa";
import { adminApi } from "../api";

export default function MeetingManagement() {
  const [role, setRole] = useState("manager");
  const [managerSearch, setManagerSearch] = useState("");
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [salespersons, setSalespersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("All Time");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
    limit: 10,
  });

  const fetchManagers = async (search = "") => {
    try {
      const res = await adminApi.getAllUsers({ role, search });
      if (res.data?.success) setManagers(res.data.data?.rows || []);
    } catch (err) {
      console.error(err);
      Toast.error("Failed to fetch managers");
    }
  };

  const fetchSalespersons = async (managerId, page = 1) => {
    try {
      setLoading(true);
      const res = await adminApi.getMySalespersons({ managerId, page });
      const data = res.data?.data || {};
      setSalespersons(data.rows || []);
      setPagination({
        currentPage: data.page || 1,
        totalItems: data.total || data.rows?.length || 0,
        totalPages: Math.ceil((data.total || 0) / (data.limit || 10)) || 1,
        limit: data.limit || 10,
      });
    } catch (err) {
      console.error(err);
      Toast.error("Failed to load salespersons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers(managerSearch);
  }, [role]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchManagers(managerSearch);
    }, 500);
    return () => clearTimeout(timeout);
  }, [managerSearch]);

  const columns = [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email ID" },
    { key: "phone", label: "Mobile Number" },
    { key: "role", label: "Role" },
  ];

  return (
    <div className="min-h-screen py-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-semibold text">
          Meeting Management
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
        {/* Left Panel */}
        <div className="layout rounded shadow-sm custom-border p-5">
          <h2 className="text-lg font-semibold text mb-4">
            Managers
          </h2>

          <div className="mb-4">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full custom-border rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="manager">Manager</option>
              <option value="owner">Owner / HR</option>
            </select>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search by Name or Team"
              value={managerSearch}
              onChange={(e) => setManagerSearch(e.target.value)}
              className="w-full custom-border border-slate-300 rounded px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FaSearch className="absolute right-3 top-3.5 text-slate-400 text-sm" />
          </div>

          <div className="flex flex-col gap-2 max-h-[65vh] overflow-y-auto pr-1">
            {managers.length > 0 ? (
              managers.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedManager(m);
                    fetchSalespersons(m.id);
                  }}
                  className={`text-left px-4 py-3 rounded transition-all duration-200 ${
                    selectedManager?.id === m.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 custom-border border-slate-200"
                  }`}
                >
                  <div className="font-semibold text-sm">
                    {m.firstName} {m.lastName}
                  </div>
                  <div className={`text-xs mt-1 ${
                    selectedManager?.id === m.id ? "text-blue-100" : "text-slate-500"
                  }`}>
                    Total Teams: {m.totalTeams || 5}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm text-center py-4">
                No managers found
              </p>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-3 bg-white rounded shadow-sm custom-border border-slate-200">
          {selectedManager ? (
            <>
              {/* Manager Header */}
              <div className="px-4 pt-4 custom-custom-border-bottom ottom">
                <h2 className="text-xl font-semibold text">
                  Managers : {selectedManager.firstName} {selectedManager.lastName}
                </h2>
              </div>

              {/* Tabs */}
              <div className="px-4 py-4 custom-border-bottom  border-slate-200">
                <div className="flex gap-2">
                  {["All Time", "Today", "This Week", "This Month"].map((tab) => (
                    <div
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                        activeTab === tab
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 custom-border border-slate-200"
                      }`}
                    >
                      {tab}
                    </div>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="px-4">
                <Table
                  columns={columns}
                  data={salespersons}
                  keyField="id"
                  emptyMessage="No salespersons found"
                  currentPage={pagination.currentPage}
                  pageSize={pagination.limit}
                  totalCount={pagination.totalItems}
                  onPageChange={(page) =>
                    fetchSalespersons(selectedManager.id, page)
                  }
                />

                {/* Summary Boxes */}
                <div className="flex gap-4 mt-4 mb-4">
                  <SummaryBox 
                    title="Total Members" 
                    value={pagination.totalItems || 10}
                    bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
                    textColor="text-blue-700"
                  />
                  <SummaryBox 
                    title="Total Meeting" 
                    value="10"
                    bgColor="bg-gradient-to-br from-emerald-50 to-emerald-100"
                    textColor="text-emerald-700"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg className="w-20 h-20 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-slate-500 text-lg font-medium">
                Select a manager to view details
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Choose a manager from the left panel to see their team and meetings
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryBox({ title, value, bgColor, textColor }) {
  return (
    <div className={`${bgColor} rounded px-8 py-5 flex flex-col items-center justify-center shadow-sm custom-border border-slate-200 min-w-[160px]`}>
      <span className={`text-3xl font-bold ${textColor} mb-1`}>{value}</span>
      <span className="text-sm font-medium text-slate-600">{title}</span>
    </div>
  );
}