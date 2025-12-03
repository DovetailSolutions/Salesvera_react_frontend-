import React, { useEffect, useMemo, useState, useContext } from "react";
import Table from "../components/Table";
import Toast from "../components/Toast";
import { AuthContext } from "../context/AuthProvider";
import { adminApi, meetingApi } from "../api";

export default function MeetingManagement() {
  const { user } = useContext(AuthContext);
  const [globalSearch, setGlobalSearch] = useState("");
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [salespersons, setSalespersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("All Time");
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingPagination, setMeetingPagination] = useState({
    currentPage: 1,
    pageSize: 7,
  });

  const paginatedMeetings = useMemo(() => {
    const { currentPage, pageSize } = meetingPagination;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMeetings.slice(startIndex, startIndex + pageSize);
  }, [filteredMeetings, meetingPagination]);

  const filteredSalespersons = useMemo(() => {
    if (!globalSearch.trim()) return salespersons;
    const term = globalSearch.toLowerCase();
    return salespersons.filter(sp =>
      `${sp.firstName} ${sp.lastName}`.toLowerCase().includes(term) ||
      sp.email.toLowerCase().includes(term) ||
      (sp.phone && sp.phone.includes(term))
    );
  }, [salespersons, globalSearch]);

  // Fetch managers (for admin)
  const fetchManagers = async () => {
  try {
    const res = await adminApi.getAdminManagers();
    if (res.data?.success) {
      // Extract managers from admin's createdUsers
      const managersList = res.data.data?.user?.createdUsers?.filter(
        (user) => user.role === "manager"
      ) || [];
      setManagers(managersList);
    } else {
      setManagers([]);
      Toast.error(res.data?.message || "Failed to load managers");
    }
  } catch (err) {
    console.error("Failed to fetch managers:", err);
    Toast.error("Failed to load managers");
    setManagers([]); // Always ensure it's an array
  }
};

  // Fetch salespersons (for manager or admin after selection)
  const fetchSalespersons = async (managerId) => {
    try {
      setLoading(true);
      const res = await adminApi.getMySalespersons({ managerId, page: 1 });
      const data = res.data?.data || {};
      setSalespersons(data.rows || []);
    } catch (err) {
      console.error("Failed to fetch salespersons:", err);
      Toast.error("Failed to load salespersons");
      setSalespersons([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch meetings for selected salesperson
  const fetchMeetings = async (userId) => {
    if (!userId) return;

    setMeetingsLoading(true);
    try {
      const res = await meetingApi.getUserMeetings({ userId });
      if (res.data?.success) {
        const allMeetings = res.data.data?.rows || [];
        setMeetings(allMeetings);
        applyMeetingFilter(allMeetings, activeTab, globalSearch);
      } else {
        setMeetings([]);
        setFilteredMeetings([]);
      }
    } catch (err) {
      // console.error("Meeting fetch error:", err);
      // Toast.error("Failed to load meetings");
      setMeetings([]);
      setFilteredMeetings([]);
    } finally {
      setMeetingsLoading(false);
    }
  };

  // Apply meeting filters (tab + search)
  const applyMeetingFilter = (meetings, tab, search = "") => {
  let filtered = [...meetings];

  if (tab === "Today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter(m => {
      if (!m.meetingTimeIn) return false;
      const mt = new Date(m.meetingTimeIn);
      return mt >= start && mt <= end;
    });
  } else if (tab === "This Week") {
    const now = new Date();
    const day = now.getDay(); // Sunday = 0
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - day);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    filtered = filtered.filter(m => {
      if (!m.meetingTimeIn) return false;
      const mt = new Date(m.meetingTimeIn);
      return mt >= weekStart && mt <= weekEnd;
    });
  } else if (tab === "This Month") {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    filtered = filtered.filter(m => {
      if (!m.meetingTimeIn) return false;
      const mt = new Date(m.meetingTimeIn);
      return mt.getFullYear() === year && mt.getMonth() === month;
    });
  }

  // Apply search
  if (search.trim()) {
    const term = search.toLowerCase();
    filtered = filtered.filter(m =>
      (m.companyName && m.companyName.toLowerCase().includes(term)) ||
      (m.personName && m.personName.toLowerCase().includes(term)) ||
      (m.mobileNumber && m.mobileNumber.includes(term)) ||
      (m.companyEmail && m.companyEmail.toLowerCase().includes(term)) ||
      (m.meetingPurpose && m.meetingPurpose.toLowerCase().includes(term))
    );
  }

  setFilteredMeetings(filtered);
};
  // Handle export meetings
  const handleExportMeetings = () => {
    if (filteredMeetings.length === 0) return;

    const headers = ["Company", "Contact", "Mobile", "Email", "Check-in", "Check-out", "Purpose"];
    const rows = filteredMeetings.map((meeting) => ({
      Company: meeting.companyName || "N/A",
      Contact: meeting.personName || "N/A",
      Mobile: meeting.mobileNumber || "N/A",
      Email: meeting.companyEmail || "N/A",
      "Check-in": meeting.meetingTimeIn
        ? new Date(meeting.meetingTimeIn).toLocaleString()
        : "N/A",
      "Check-out": meeting.meetingTimeOut
        ? new Date(meeting.meetingTimeOut).toLocaleString()
        : "—",
      Purpose: meeting.meetingPurpose || "N/A",
    }));

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = String(row[header] ?? "").replace(/"/g, '""');
            return `"${value}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `meetings_${selectedSalesperson?.firstName}_${selectedSalesperson?.lastName}_${activeTab}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Initialize data based on role
  useEffect(() => {
    if (!user) return;

    if (user.role === "admin") {
      fetchManagers();
    } else if (user.role === "manager") {
      fetchSalespersons(user.id);
    }
  }, [user]);

  // Apply filters when dependencies change
  useEffect(() => {
    if (selectedSalesperson) {
      applyMeetingFilter(meetings, activeTab, globalSearch);
    }
  }, [globalSearch, activeTab, selectedSalesperson, meetings]);

  // Reset pagination when filters change
  useEffect(() => {
    setMeetingPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [activeTab, globalSearch]);

  const isManager = user?.role === "manager";
  const isAdmin = user?.role === "admin";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Meeting Management</h1>
          <div className="flex gap-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white shadow hover:shadow-lg transform hover:-translate-y-0.5 transition px-4 py-2 rounded">
              + Schedule Meeting
            </button>
            {selectedSalesperson && filteredMeetings.length > 0 && (
              <button
                onClick={handleExportMeetings}
                className="bg-green-600 hover:bg-green-700 text-white shadow hover:shadow-lg transform hover:-translate-y-0.5 transition px-4 py-2 rounded"
              >
                Export Meetings (CSV)
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-5 h-full">
          {/* Left Panel */}
          <div className="w-full lg:w-[16rem] flex flex-col h-full">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden p-4">
              {/* Admin: Show manager dropdown */}
              {isAdmin && (
                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-2">Managers</h2>
                  <select
                    value={selectedManager?.id || ""}
                    onChange={(e) => {
                      const managerId = e.target.value;
                      const manager = managers.find((m) => m.id === Number(managerId)) || null;
                      setSelectedManager(manager);
                      setSelectedSalesperson(null);
                      setMeetings([]);
                      if (manager) {
                        fetchSalespersons(manager.id);
                      } else {
                        setSalespersons([]);
                      }
                    }}
                    className="w-full rounded-full border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="" disabled>Select a manager</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Search Bar */}
              <input
                type="text"
                placeholder={isManager 
                  ? "Search salesperson..." 
                  : "Search salesperson or meeting..."
                }
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="px-4 py-2 rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm w-full text-sm mb-4"
              />

              {/* Salesperson List */}
              <div className="flex-1 overflow-hidden">
                <h3 className="text-sm font-medium text-slate-600 mb-2">
                  {isAdmin ? "Team Members" : "My Team"}
                </h3>
                <div className="flex flex-col gap-2 overflow-y-auto pr-1 pt-2 h-full max-h-[60vh]">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-sm">Loading team...</p>
                    </div>
                  ) : filteredSalespersons.length > 0 ? (
                    filteredSalespersons.map((sp) => (
                      <div
                        key={sp.id}
                        onClick={() => {
                          setSelectedSalesperson(sp);
                          fetchMeetings(sp.id);
                        }}
                        className={`relative rounded-3xl border p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                          selectedSalesperson?.id === sp.id
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="font-medium capitalize">
                          {sp.firstName} {sp.lastName}
                        </div>
                        <div className="text-xs line-clamp-1 opacity-90">
                          {sp.email}
                        </div>
                        <div className="text-xs opacity-90">
                          {sp.phone || "—"}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      {isAdmin 
                        ? (selectedManager ? "No team members found." : "Select a manager to view their team")
                        : "No team members found."
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col h-full">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
              {isAdmin && selectedManager ? (
                <div className="px-4 pt-4">
                  <h2 className="text-xl font-semibold">
                    Manager: {selectedManager.firstName} {selectedManager.lastName}
                  </h2>
                </div>
              ) : isManager ? (
                <div className="px-4 pt-4">
                  <h2 className="text-xl font-semibold">My Sales Team</h2>
                </div>
              ) : null}

              {/* Tabs */}
              {selectedSalesperson && (
                <div className="px-4 py-4">
                  <div className="flex gap-2 flex-wrap">
                    {["All Time", "Today", "This Week", "This Month"].map((tab) => (
                      <div
                        key={tab}
                        onClick={() => {
                          setActiveTab(tab);
                          applyMeetingFilter(meetings, tab, globalSearch);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                          activeTab === tab
                            ? "bg-blue-500 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {tab}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meeting Content */}
              <div className="flex-1 overflow-hidden px-4 pb-4">
                {selectedSalesperson ? (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        Meetings: {selectedSalesperson.firstName} {selectedSalesperson.lastName}
                      </h3>
                    </div>
                    <Table
                      columns={[
                        { key: "companyName", label: "Company", render: (row) => row.companyName || "N/A" },
                        { key: "personName", label: "Contact", render: (row) => row.personName || "N/A" },
                        { key: "mobileNumber", label: "Mobile", render: (row) => row.mobileNumber || "N/A" },
                        { 
                          key: "companyEmail", 
                          label: "Email", 
                          render: (row) => <span className="break-words">{row.companyEmail || "N/A"}</span> 
                        },
                        {
                          key: "meetingTimeIn",
                          label: "Check-in",
                          render: (row) =>
                            row.meetingTimeIn ? new Date(row.meetingTimeIn).toLocaleString() : "N/A",
                        },
                        {
                          key: "meetingTimeOut",
                          label: "Check-out",
                          render: (row) =>
                            row.meetingTimeOut ? new Date(row.meetingTimeOut).toLocaleString() : "—",
                        },
                        {
                          key: "meetingPurpose",
                          label: "Purpose",
                          render: (row) => (
                            <span className="line-clamp-1">{row.meetingPurpose || "N/A"}</span>
                          ),
                        },
                      ]}
                      data={paginatedMeetings}
                      keyField="id"
                      emptyMessage="No meetings found"
                      currentPage={meetingPagination.currentPage}
                      pageSize={meetingPagination.pageSize}
                      totalCount={filteredMeetings.length}
                      onPageChange={(page) =>
                        setMeetingPagination((prev) => ({ ...prev, currentPage: page }))
                      }
                      loading={meetingsLoading}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-center text-slate-500">
                    <svg className="w-16 h-16 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-lg">
                      {isAdmin 
                        ? "Select a salesperson to view their meetings"
                        : "No salesperson selected"}
                    </p>
                  </div>
                )}
              </div>

              {/* Stats */}
               <div className="flex items-center justify-start gap-2 mx-4 mb-4">
    <div className="flex items-center justify-center gap-2 bg-[#3B82F60D] p-5 rounded-xl">
    <span className="text-4xl font-bold">{filteredSalespersons.length} </span> Total Members
  </div>
  <div className="flex items-center justify-center gap-2 bg-[#3B82F60D] p-5 rounded-xl">
    <span className="text-4xl font-bold">{meetings.length} </span> Total Meetings
  </div>
</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}