import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import Toast from "../components/Toast";
import { FaSearch } from "react-icons/fa";
import { adminApi, meetingApi } from "../api";

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

  const [filteredMeetings, setFilteredMeetings] = useState([]);

  const [selectedSalesperson, setSelectedSalesperson] = useState(null);
const [meetings, setMeetings] = useState([]);
const [meetingsLoading, setMeetingsLoading] = useState(false);

  const fetchManagers = async (search = "") => {
    try {
      const res = await adminApi.getAllUsers({ role, search });
      if (res.data?.success) setManagers(res.data.data?.finalRows || []);
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

  const getDateForTab = (tab) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  if (tab === "Today") {
    return `${year}-${month}-${day}`;
  } else if (tab === "This Week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // Sunday as start
    return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  } else if (tab === "This Month") {
    return `${year}-${month}-01`;
  } else {
    // All Time → use today (since API requires date)
    return `${year}-${month}-${day}`;
  }
};

const fetchMeetings = async (userId) => {
  if (!userId) return;

  setMeetingsLoading(true);
  try {
    // Always fetch ALL meetings (no date filter)
    const res = await meetingApi.getUserMeetings({ userId });
    if (res.data?.success) {
      const allMeetings = res.data.data?.rows || [];
      setMeetings(allMeetings);
      // Apply initial filter based on current tab
      applyMeetingFilter(allMeetings, activeTab);
    } else {
      setMeetings([]);
      setFilteredMeetings([]);
    }
  } catch (err) {
    console.error("Meeting fetch error:", err);
    Toast.error("Failed to load meetings");
    setMeetings([]);
    setFilteredMeetings([]);
  } finally {
    setMeetingsLoading(false);
  }
};

const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const isSameWeek = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const dayDiff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
  return dayDiff >= 0 && dayDiff <= 6 && d1.getDay() <= d2.getDay();
};

const isSameMonth = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth();
};

const applyMeetingFilter = (meetings, tab) => {
  const now = new Date();
  
  let filtered = meetings;
  
  if (tab === "Today") {
    filtered = meetings.filter(m => {
      const meetingDate = new Date(m.meetingTimeIn);
      return isSameDay(meetingDate, now);
    });
  } 
  else if (tab === "This Week") {
    // Week starts on Sunday
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    
    filtered = meetings.filter(m => {
      const meetingDate = new Date(m.meetingTimeIn);
      return meetingDate >= weekStart && meetingDate <= now;
    });
  } 
  else if (tab === "This Month") {
    filtered = meetings.filter(m => {
      const meetingDate = new Date(m.meetingTimeIn);
      return isSameMonth(meetingDate, now);
    });
  }
  // "All Time" shows all meetings
  
  setFilteredMeetings(filtered);
};

  return (
    <div className="min-h-screen py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-semibold text">
          Meeting Management
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">

       {/* Left Panel - Improved Design */}
<div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-slate-200 p-5 flex flex-col h-fit">
  <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
    <span>📊</span>
    <span className="ml-2">Select Manager</span>
  </h2>

  {/* Manager Dropdown */}
  <div className="mb-5">
    <label className="block text-sm font-medium text-slate-600 mb-1">
      Manager
    </label>
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
      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
    >
      <option value="">— Select a manager —</option>
      {managers.map((m) => (
        <option key={m.id} value={m.id}>
          {m.firstName} {m.lastName}
        </option>
      ))}
    </select>
  </div>

  {/* Salesperson List */}
  <div className="mt-2">
    <h3 className="text-sm font-medium text-slate-600 mb-2">
      Team Members
    </h3>
    <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1 pt-2">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-6 text-slate-500">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-sm">Loading team...</p>
        </div>
      ) : salespersons.length > 0 ? (
        salespersons.map((sp) => (
          <div
            key={sp.id}
            onClick={() => {
              setSelectedSalesperson(sp);
              fetchMeetings(sp.id);
            }}
            className={`relative rounded-lg border p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${
              selectedSalesperson?.id === sp.id
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            {selectedSalesperson?.id === sp.id && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
            <div className="font-medium text-slate-800">
              {sp.firstName} {sp.lastName}
            </div>
            <div className="mt-1 text-xs text-slate-600 line-clamp-1">
              📧 {sp.email}
            </div>
            <div className="text-xs text-slate-600">
              📱 {sp.phone || "—"}
            </div>
            <div className="mt-1">
              <span className="inline-block px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded capitalize">
                {sp.role || "salesperson"}
              </span>
            </div>
          </div>
        ))
      ) : selectedManager ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          <p>No team members found.</p>
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500 text-sm">
          <p className="mb-1">👉 Select a manager</p>
          <p>to view their sales team</p>
        </div>
      )}
    </div>
  </div>
</div>

        {/* Right Panel */}
        {/* Right Panel */}
<div className="lg:col-span-3 bg-white rounded shadow-sm custom-border border-slate-200">
  {selectedManager ? (
    <>
      {/* Manager Header */}
      <div className="px-4 pt-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold">
          Manager: {selectedManager.firstName} {selectedManager.lastName}
        </h2>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4 border-b border-slate-200">
        <div className="flex gap-2">
          {["All Time", "Today", "This Week", "This Month"].map((tab) => (
            <div
              key={tab}
              // In your tab click handler
onClick={() => {
  setActiveTab(tab);
  if (selectedSalesperson) {
    applyMeetingFilter(meetings, tab);
  }
}}
              className={`px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-200 ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      {/* Meeting Content Area (only this part changes based on selection) */}
      <div className="px-4 py-4">
        {selectedSalesperson ? (
          <>
            <h3 className="text-lg font-medium mb-3">
              Meetings: {selectedSalesperson.firstName} {selectedSalesperson.lastName}
            </h3>
            <Table
  columns={[
    {
      key: "companyName",
      label: "Company",
      render: (row) => row.companyName || "N/A",
    },
    {
      key: "personName",
      label: "Contact",
      render: (row) => row.personName || "N/A",
    },
    {
      key: "mobileNumber",
      label: "Mobile",
      render: (row) => row.mobileNumber || "N/A",
    },
    {
      key: "companyEmail",
      label: "Email",
      render: (row) => row.companyEmail || "N/A",
    },
    {
      key: "meetingTimeIn",
      label: "Check-in",
      render: (row) =>
        row.meetingTimeIn
          ? new Date(row.meetingTimeIn).toLocaleString()
          : "N/A",
    },
    {
      key: "meetingTimeOut",
      label: "Check-out",
      render: (row) =>
        row.meetingTimeOut
          ? new Date(row.meetingTimeOut).toLocaleString()
          : "—",
    },
    {
      key: "meetingPurpose",
      label: "Purpose",
      render: (row) => row.meetingPurpose || "N/A",
    },
  ]}
  data={filteredMeetings}
  keyField="id"
  emptyMessage="No meetings found"
/>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500">
            <p className="text-lg">Select a salesperson to view their meetings</p>
          </div>
        )}
      </div>
    </>
  ) : (
    <div className="flex flex-col items-center justify-center h-full py-10 text-center">
      <svg className="w-20 h-20 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p className="text-slate-500 text-lg font-medium">
        Select a manager to view their team
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